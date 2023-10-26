import { parseISO, formatISO, isValid } from "date-fns";

import { Month, Weekday } from "@/common/constants";
import { TypeConvesations } from "@/domain/interfaces";
import { ClinicModel } from "@/domain/models";
import { UserSession } from "@/domain/models/user-sesssion";
import { CalendarService } from "@/domain/services";
import { IConversation } from "@/domain/usecases";
import { TypeSend } from "../interfaces";
import Messages from "../messages";

const dateIdMapping = new Map();

export class InformDayConversation implements IConversation {
  conversations: TypeConvesations = {};

  constructor(
    private readonly send: TypeSend,
    private readonly clinic: ClinicModel,
    private readonly calendarService: CalendarService,
    private readonly informScheduleConversation: IConversation
  ) { }

  async ask(
    session: UserSession,
    { complement } = { complement: undefined }
  ): Promise<void> {
    if (complement) await this.send(session.id, { text: complement });

    const days = await this.calendarService.freeDays({
      clinic_id: this.clinic.id,
      specialty_id: session.data.specialty_id,
      start_date: formatISO(new Date(), { representation: "date" }),
    });

    if (!days.length) {
      return await session.conversation_stack.pop()?.ask(session, {
        complement: "Parece que não temos dias disponíveis para esse serviço.",
      });
    }

    // for (const day of days) {
    //   buttons.push({
    //     buttonText:{displayText:  `${Weekday[day.getDay()]}, ${day.getDate()} de ${
    //       Month[day.getMonth() + 1]
    //     }`},
    //     buttonId: formatISO(day, { representation: "date" }),
    //   });
    // }

    const buttons = [];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const dateId = i + 1;
      dateIdMapping.set(dateId, day);

      buttons.push({
        buttonText: {
          displayText: ` ${Weekday[day.getDay()]}, ${day.getDate()} de ${Month[day.getMonth() + 1]}`,
        },
        buttonId: dateId.toString(),
      });
    }

    await this.send(session.id, {
      text: session.data.appointment
        ? Messages.INFORMDAYREAPOINTMENT
        : Messages.INFORMDAY,
      buttons
    });

    session.conversation = this;
  }

  async answer(session: UserSession, { clean_text }): Promise<void> {
    if (this.conversations[clean_text]) {
      session.data.appointment = undefined;
      return await this.conversations[clean_text].ask(session);
    }

    if (clean_text == "volta" || clean_text == "voltar")
      return await session.conversation_stack.pop()?.ask(session);

    // const day = parseISO(clean_text);

    const selectedId = parseInt(clean_text);

    if (dateIdMapping.has(selectedId)) {
      const selectedDate = dateIdMapping.get(selectedId);
      session.data.day = selectedDate;
      session.conversation_stack.push(this);
    }

    // if (!isValid(day))
    //   return await this.ask(session, { complement: Messages.INVALIDDAY });

    // session.data.day = day;

    // session.conversation_stack.push(this);

    await this.informScheduleConversation.ask(session);
  }
}
