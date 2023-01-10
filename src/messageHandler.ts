export enum MessageCommand {
  commit,
  addBreakpoint,
  editorSelection,
  editorOnChange,
  loadFile,
  addressTypeChange,
  configUpdate,
}

export type EditorMessage = { command: MessageCommand, data: Record<string, any> }
