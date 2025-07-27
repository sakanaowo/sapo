declare module 'onscan.js' {
    export interface ScanOptions {
        suffixKeyCodes?: number[];
        prefixKeyCodes?: number[];
        reactToPaste?: boolean;
        reactToKeydown?: boolean;
        timeBetweenScansMillis?: number;
        singleScanQty?: number;
        minLength?: number;
        avgTimeByChar?: number;
        ignoreIfFocusOn?: boolean | Element | Element[];
        scanButtonKeyCode?: number;
        scanButtonLongPressThreshold?: number;
        onScan?: (sCode: string, iQty: number) => void;
        onScanError?: (oEvent: Event) => void;
        onScanButtonLongPressed?: () => void;
        onKeyDetect?: (iKeyCode: number, oEvent: KeyboardEvent) => boolean;
        onKeyProcess?: (sChar: string, oEvent: KeyboardEvent) => void;
        onPaste?: (sPasted: string, oEvent: ClipboardEvent) => void;
        keyCodeMapper?: (oEvent: KeyboardEvent) => string;
        stopPropagation?: boolean;
        preventDefault?: boolean;
    }

    const onScan: {
        attachTo: (target: EventTarget, options?: ScanOptions) => void;
        detachFrom: (target: EventTarget) => void;
        isAttachedTo: (target: EventTarget) => boolean;
        simulate: (target: EventTarget, sBarcode: string) => void;
        decodeKeyEvent: (oEvent: KeyboardEvent) => string;
        ignoreIfFocusOn: (oElement: Element | Element[]) => boolean;
    };

    export default onScan;
}