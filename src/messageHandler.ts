export enum MessageCommand {
  commit,
  addBreakpoint,
  editorSelection,
  loadFile,
  addressTypeChange,
  configUpdate,
  editorChange
}

export type EditorMessage = { command: MessageCommand, data: Record<string, any> }
