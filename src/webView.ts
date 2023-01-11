import * as vscode from 'vscode'
import * as fs from 'fs'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import { logicalDisplay, DisplayState } from './fileUtils'
import { EditorMessage, MessageCommand } from './messageHandler'

/** Data editor message data structure for communication between Webview and VSCode. */


export class WebView implements vscode.Disposable {
  private panel: vscode.WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  private fileToEdit: string = ""
  private fileData: Buffer = Buffer.alloc(0)
  private displayState = new DisplayState()

  constructor(
    protected context: vscode.ExtensionContext,
    private view: string,
    title: string
  ) {
    this.panel = this.createPanel(title)
    this.panel.webview.onDidReceiveMessage(this.messageReceiver, this)

    this.svelteWebviewInitializer = new SvelteWebviewInitializer(context)
    this.svelteWebviewInitializer.initialize(this.view, this.panel.webview)
  }

  dispose(): void {
    this.panel.dispose()
  }

  show(): void {
    this.panel.reveal()
  }

  setTitle(title: string): void {
    this.panel.title = title
  }

  private createPanel(title: string): vscode.WebviewPanel {
    vscode.window
      .showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select',
      canSelectFiles: true,
      canSelectFolders: false,
    })
    .then((fileUri) => {
      if (fileUri && fileUri[0]) {
        this.fileToEdit = fileUri[0].fsPath
      }
      let data = fs.readFileSync(this.fileToEdit)
      this.fileData = Buffer.from(data);
      let msgData = new Uint8Array(data.toString(this.displayState.editorDisplay.encoding).split('').map((e)=>e.charCodeAt(0)))
      console.log(msgData)

      this.panel.webview.postMessage({
        command: MessageCommand.loadFile,
        metrics: { 
          type: fs.statSync(this.fileToEdit).mode, 
          size: this.fileData.length, 
          asciiCount: 0 },
        editor:   { fileData: msgData },
        display:  { logical: logicalDisplay(this.fileData, this.displayState.logicalDisplay) }        
      });
    })

    const column =
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn
        ? vscode.window.activeTextEditor?.viewColumn
        : vscode.ViewColumn.Active
    return vscode.window.createWebviewPanel(this.view, title, column)
  }

  private messageReceiver(message: EditorMessage) {
    switch( message.command ) {

      case MessageCommand.editorOnChange:
        this.displayState.updateEditorDisplayState(message.data.editor);
        
        var bufSlice: string = this.fileData
        .slice(this.displayState.editorDisplay.start, this.displayState.editorDisplay.end)
        .toString(message.data.editor.encoding)

        console.log(bufSlice)

        this.panel.webview.postMessage({
          command: MessageCommand.editorOnChange,
          display: { editor: bufSlice }
        });
        break;
        
      case MessageCommand.commit:
        vscode.window.showInformationMessage(`Request OmegaEdit change { offset: ${message.data.fileOffset},
          dataLength: ${message.data.dataLength},
          convertFromEncoding: ${message.data.encoding},
          data: [ ${message.data.data} ] }`)

        break;
    }
  }
}
