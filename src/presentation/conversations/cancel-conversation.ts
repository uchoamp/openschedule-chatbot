import { Month, Weekday } from "@/common/constants";
import { TypeConvesations } from "@/domain/interfaces";
import { UserSession } from "@/domain/models/user-sesssion";
import { AppointmentService } from "@/domain/services";
import { IConversation } from "@/domain/usecases";
import { TypeSend } from "../interfaces";
import Messages from "../messages";

export class CancelConversation implements IConversation {
  conversations: TypeConvesations = {};

  constructor(
    private readonly send: TypeSend,
    private readonly appointmentService: AppointmentService,
    private readonly youAreWelcomeConversation: IConversation
  ) {}

  async ask(session: UserSession): Promise<void> {
    const appointment = session.data.appointment;

    await this.send(session.id, {
      text: Messages.CANCELAPPOINTMENT.format(
        Weekday[appointment.scheduled_day.getDay()].toLowerCase(),
        appointment.scheduled_day.getDate().toString(),
        Month[appointment.scheduled_day.getMonth() + 1].toLowerCase(),
        appointment.start_time.toClockTime()
      ),
      buttons: Messages.SNBUTTONS,
    });
    session.conversation = this;
  }

  async answer(session: UserSession, { clean_text }): Promise<void> {
    if (this.conversations[clean_text]) {
      session.data.appointment = undefined;
      await this.conversations[clean_text].ask(session);
    }

    if (clean_text === "sim") {
      const appointment = session.data.appointment;
      await this.appointmentService.deleteById(session.data.appointment.id);
      await this.send(session.id, {
        text: Messages.CANCELEDAPPOINTMENT.format(
          Weekday[appointment.scheduled_day.getDay()].toLowerCase(),
          appointment.scheduled_day.getDate().toString(),
          Month[appointment.scheduled_day.getMonth() + 1].toLowerCase(),
          appointment.start_time.toClockTime()
        ),
      });
      session.data.appointment = undefined;
      await this.youAreWelcomeConversation.ask(session);
    } else if (clean_text == "nao") {
      await session.conversation_stack.pop()?.ask(session);
    } else await this.send(session.id, { text: Messages.SORRYNOTUDERSTAND });
  }
}
