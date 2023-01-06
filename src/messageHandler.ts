export enum MessageCommand {
    commit,
    addBreakpoint,
    processSelection,
    editorSelection,
    loadFile,
    addressTypeChange,
    configUpdate
  }

export type EditorMessage = { command: MessageCommand, data: Record<string, any> }
