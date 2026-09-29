export interface StepHandle {
  submit: () => Promise<boolean>;
}
