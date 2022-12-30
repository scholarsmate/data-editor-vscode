import * as vscode from 'vscode'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'

/** Data editor message data structure for communication between Webview and VSCode. */
type EditorMessage = {
  command: string,
  data: string,
  srcElement?: string
}

export class WebView implements vscode.Disposable {
  private panel: vscode.WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer

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
    const column =
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn
        ? vscode.window.activeTextEditor?.viewColumn
        : vscode.ViewColumn.Active
    return vscode.window.createWebviewPanel(this.view, title, column)
  }

  private messageReceiver(message: EditorMessage) {
    if( message.srcElement === "commit_btn" ) {
      vscode.window.showInformationMessage(`Sending commit changes message to Omega Edit.\nData: ${message.data}`);
    }
    if( message.srcElement === "add_data_breakpoint_button" ) {
      vscode.window.showInformationMessage(`Sending add breakpoint message to Omega Edit.\nData: ${message.data}`);
    }
  }
}
