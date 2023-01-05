export enum MessageCommand {
    commit,
    addBreakpoint,
    processSelection
}

export type EditorMessage = { command: MessageCommand, data: Record<string, any> }

// // Define the key-value data type
// type KeyValue = {
//     [command in MessageCommand]: EditorMessage;
// };

// // Create an instance of the KeyValue data type
// const keyValue: KeyValue = {
//     [MessageCommand.commit]: EditorMessage,
//     [Key.Key2]: new Value('Value 2'),
//     [Key.Key3]: new Value('Value 3')
// };

// // Access the values of the KeyValue data type using the keys
// console.log(keyValue[Key.Key1].data); // 'Value 1'
// console.log(keyValue[Key.Key2].data); // 'Value 2'
// console.log(keyValue[Key.Key3].data); // 'Value 3'
