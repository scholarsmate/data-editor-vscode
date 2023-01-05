import * as vscode from 'vscode'
import * as fs from 'fs'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import { encodeForDisplay, makeAddressRange, makeOffsetRange, logicalDisplay } from './fileUtils'
import { EditorMessage, MessageCommand } from './messageHandler'

/** Data editor message data structure for communication between Webview and VSCode. */


export class WebView implements vscode.Disposable {
  private panel: vscode.WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  private fileToEdit: string = ""

  constructor(
    protected context: vscode.ExtensionContext,
    private view: string,
    title: string
  ) {
    this.panel = this.createPanel(title)
    this.panel.webview.onDidReceiveMessage(this.messageReceiver)

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
      const data = fs.readFileSync(this.fileToEdit);

      this.panel.webview.postMessage({
        command: 'loadFile',
        metrics: { 
          type: fs.statSync(this.fileToEdit).mode, 
          size: data.length, 
          asciiCount: 0 
        },
        display: {
          address: makeAddressRange(0, Math.ceil(data.length / 16), 16, 16),
          physicalOffset: makeOffsetRange(10, 2),
          physical: encodeForDisplay(data, 16, 16),
          logicalOffset: makeOffsetRange(10, 1),
          logical: logicalDisplay(data, 16)
        }
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
      case MessageCommand.processSelection:
        vscode.window.showInformationMessage( `Send index [${message.data.start}:${message.data.end}]` )
        break;
    }
  }
}
