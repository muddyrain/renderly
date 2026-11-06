import type { ButtonProps } from "@/components/ui/button";

type Assert<T extends true> = T;
export type NativeDisabledButton = Assert<
  { disabled: true } extends ButtonProps ? true : false
>;
export type SlottedLink = Assert<
  { asChild: true } extends ButtonProps ? true : false
>;
export type DisabledSlotRejected = Assert<
  { asChild: true; disabled: true } extends ButtonProps ? false : true
>;
