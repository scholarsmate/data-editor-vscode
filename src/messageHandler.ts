export enum MessageCommand {
  commit,
  addBreakpoint,
  editorOnChange,
  loadFile,
}

export type EditorMessage = { command: MessageCommand, data: Record<string, any> }
