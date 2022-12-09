import { Month, Weekday } from "@/common/constants";
import { TypeConvesations } from "@/domain/interfaces";
import { ClinicModel } from "@/domain/models";
import { UserSession } from "@/domain/models/user-sesssion";
import { CalendarService } from "@/domain/services";
import { IConversation } from "@/domain/usecases";
import { formatISO } from "date-fns";
import { TypeSend } from "../interfaces";
import Messages from "../messages";

export class InformScheduleConversation implements IConversation {
  conversations: TypeConvesations = {};

  constructor(
    private readonly send: TypeSend,
    private readonly clinic: ClinicModel,
    private readonly calendarService: CalendarService,
    private readonly confirmAppointmentConversation: IConversation
  ) {}

  async ask(
    session: UserSession,
    { complement } = { complement: undefined }
  ): Promise<void> {
    if (complement) await this.send(session.id, { text: complement });

    const schedules = await this.calendarService.availableSchedules({
      clinic_id: this.clinic.id,
      specialty_id: session.data.specialty_id,
      day: formatISO(session.data.day, { representation: "date" }),
    });

    if (!schedules.length) {
      return await session.conversation_stack.pop()?.ask(session, {
        complement: Messages.WITHOUTFREESCHEDULES.format(
          session.data.day.getDate().toString(),
          Month[session.data.day.getMonth() + 1].toLowerCase()
        ),
      });
    }

    const rows = [];
    session.data.schedules = schedules;

    for (let schedule of schedules) {
      rows.push({
        title:
          schedule.start_time.toClockTime() +
          " - " +
          schedule.professional_name,
        rowId: schedule.id,
      });
    }

    const day = session.data.day;

    await this.send(session.id, {
      text: session.data.appointment
        ? Messages.INFORMSCHEDULEREAPPOINTMENT.format(
            Weekday[day.getDay()],
            day.getDate().toString(),
            Month[day.getMonth()]
          )
        : Messages.INFORMSCHEDULE.format(
            Weekday[day.getDay()],
            day.getDate().toString(),
            Month[day.getMonth()]
          ),
      buttonText: "Horarios disponíveis para agendametno",
      sections: [{ rows }],
    });

    session.conversation = this;
  }

  async answer(session: UserSession, { clean_text }): Promise<void> {
    if (this.conversations[clean_text]) {
      session.data.appointment = undefined;
      return await this.conversations[clean_text].ask(session);
    }

    if (
      clean_text == "volta" ||
      clean_text == "voltar" ||
      clean_text == "outro dia"
    )
      return await session.conversation_stack.pop()?.ask(session);

    const schedule = session.data.schedules.find(
      (sc) => sc.id == Number(clean_text)
    );
    if (!schedule)
      return await this.ask(session, { complement: Messages.INVALIDSCHEDULE });

    session.data.schedule = schedule;
    session.conversation_stack.push(this);
    await this.confirmAppointmentConversation.ask(session);
  }
}
