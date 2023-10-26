import { TypeConvesations } from "@/domain/interfaces";
import { UserSession } from "@/domain/models/user-sesssion";
import { IConversation } from "@/domain/usecases";
import { TypeSend } from "../interfaces";
import Messages from "../messages";

export class NewUserConversation implements IConversation {
  conversations: TypeConvesations = {};

  constructor(
    private readonly send: TypeSend,
    private readonly informNameConveration: IConversation,
    private readonly optionsConversation: IConversation,
    private readonly undefinableConversation: IConversation
  ) {}

  async ask(
    session: UserSession,
    { complement } = { complement: Messages.WELCOME }
  ): Promise<void> {
    await this.send(session.id, { text: complement });
    await this.send(session.id, {
      text: Messages.SNCADASTRO,
      buttons: Messages.SNBUTTONS,
    });
    session.conversation = this;
  }

  async answer(session: UserSession, { clean_text }): Promise<void> {
    if (clean_text === "1") await this.informNameConveration.ask(session);
    else if (clean_text == "2") await this.optionsConversation.ask(session);
    else if (this.conversations[clean_text])
      await this.conversations[clean_text].ask(session);
    else
      await this.undefinableConversation.ask(session, {
        complement: Messages.SORRYUDERSTAND,
      });
  }
}
