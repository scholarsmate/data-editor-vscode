import * as vscode from 'vscode'
import * as fs from 'fs'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'

enum MessageCommand {
  commit,
  addBreakpoint,
}
/** Data editor message data structure for communication between Webview and VSCode. */
type EditorMessage = {
  command: MessageCommand,
  data: string,
  srcElement?: HTMLElement
}

export class WebView implements vscode.Disposable {
  private panel: vscode.WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  private fileToEdit: string = ''

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
        vscode.window.showInformationMessage(
          'Selected file: ' + this.fileToEdit
        )
      })

    const column =
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn
        ? vscode.window.activeTextEditor?.viewColumn
        : vscode.ViewColumn.Active
    return vscode.window.createWebviewPanel(this.view, title, column)
  }

  private messageReceiver(message: EditorMessage) {
    vscode.window.showInformationMessage(`Received <${message.command}> signal from UI.`);
    
    switch( message.command ) {
      // TODO: Specific cmd functionality to Omega Edit.
    }
  }
}
