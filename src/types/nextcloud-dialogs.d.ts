declare module '@nextcloud/dialogs' {
    export class DialogBuilder {
        constructor(options?: any);

        setName(name: string): DialogBuilder;
        setText(text: string): DialogBuilder;
        setButtons(buttons: any[]): DialogBuilder;
        build(): any;
        show(): void;
    }

    export function showError(message: string): void;

    const _default: any;
    export default _default;
}
