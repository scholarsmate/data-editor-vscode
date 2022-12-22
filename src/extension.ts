import * as vscode from 'vscode'
import { WebView } from './webView'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('dataEditor.edit', () => {
      const webView = new WebView(context, 'dataEditor', 'Data Editor')
      webView.show()
    })
  )
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // do nothing
}
