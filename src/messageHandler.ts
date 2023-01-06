export enum MessageCommand {
    commit,
    addBreakpoint,
    processSelection,
    editorSelection,
    loadFile,
    addressTypeChange
  }

export type EditorMessage = { command: MessageCommand, data: Record<string, any> }
