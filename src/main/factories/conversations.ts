import { TypeConvesations } from "@/domain/interfaces";
import { ClinicaModel } from "@/domain/models";
import {
  AboutClinicConversation,
  InformCpfConversation,
  InformNameConversation,
  NewUserConversation,
  OptionsConversation,
  WelcomeBackConversation,
} from "@/presentation/conversations";
import { TypeSend } from "@/presentation/interfaces";
import { clienteService } from "./services";

export const buildConversations = (
  send: TypeSend,
  clinica: ClinicaModel
): TypeConvesations => {
  const optionsConversation = new OptionsConversation(send);

  const aboutClinicConversation = new AboutClinicConversation(
    send,
    clinica,
    optionsConversation
  );

  const welcomeBackConversation = new WelcomeBackConversation(
    send,
    optionsConversation
  );

  const informCpfConversation = new InformCpfConversation(
    send,
    clienteService,
    undefined
  );
  const informNameConversation = new InformNameConversation(
    send,
    informCpfConversation
  );

  const newUserConversation = new NewUserConversation(
    send,
    informNameConversation,
    optionsConversation,
    optionsConversation
  );

  optionsConversation.aboutClinicConversation = aboutClinicConversation;

  return { newUserConversation, welcomeBackConversation };
};
