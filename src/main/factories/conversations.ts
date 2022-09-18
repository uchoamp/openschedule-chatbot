import { TypeConvesations } from "@/domain/interfaces";
import { ClinicaModel } from "@/domain/models";
import {
  AboutClinicConversation,
  AppointmentConversation,
  AppointmentsConversation,
  ConfirmConversation,
  InformCpfConversation,
  InformDayConversation,
  InformMonthConversation,
  InformNameConversation,
  InformScheduleConversation,
  NewUserConversation,
  OptionsConversation,
  WelcomeBackConversation,
  YouAreWelcomeConversation,
} from "@/presentation/conversations";
import { TypeSend } from "@/presentation/interfaces";
import { clienteService, consultaService, horarioService } from "./services";

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

  const youAreWelcomeConversation = new YouAreWelcomeConversation(
    optionsConversation
  );

  const informScheduleConversation = new InformScheduleConversation(
    send,
    clinica,
    horarioService,
    consultaService,
    youAreWelcomeConversation
  );

  const informDayConversation = new InformDayConversation(
    send,
    clinica,
    horarioService,
    informScheduleConversation
  );

  const informMonthConversation = new InformMonthConversation(
    send,
    informDayConversation
  );

  const newAppointmentConversation = new ConfirmConversation(
    send,
    informMonthConversation,
    optionsConversation,
    optionsConversation
  );

  const appointmentConversation = new AppointmentConversation(
    send,
    informMonthConversation,
    undefined
  );

  const appointmentsConversation = new AppointmentsConversation(
    send,
    clinica,
    consultaService,
    newAppointmentConversation,
    appointmentConversation,
    optionsConversation
  );

  optionsConversation.aboutClinicConversation = aboutClinicConversation;
  optionsConversation.appointmentsConversation = appointmentsConversation;
  optionsConversation.informMounthConversation = informMonthConversation;

  return { newUserConversation, welcomeBackConversation };
};
