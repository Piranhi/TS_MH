export interface ToastOptions {
    title: string;
    text: string;
}

export class ToastManager {
    private static _instance: ToastManager;
    static get instance() {
        return this._instance || (this._instance = new ToastManager());
    }

    private container: HTMLElement;
    private queue: ToastOptions[] = [];
    private current: HTMLElement | null = null;

    private constructor() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    enqueue(title: string, text: string) {
        this.queue.push({ title, text });
        if (!this.current) {
            this.showNext();
        }
    }

    private showNext() {
        if (this.queue.length === 0) {
            this.current = null;
            return;
        }

        const { title, text } = this.queue.shift()!;
        const toast = document.createElement('div');
        toast.className = 'toast';

        const h4 = document.createElement('h4');
        h4.className = 'toast-title';
        h4.textContent = title;

        const p = document.createElement('p');
        p.className = 'toast-text';
        p.textContent = text;

        const btn = document.createElement('button');
        btn.className = 'ui-button toast-ok';
        btn.textContent = 'OK';
        btn.addEventListener('click', () => {
            toast.remove();
            this.current = null;
            this.showNext();
        });

        toast.appendChild(h4);
        toast.appendChild(p);
        toast.appendChild(btn);

        this.container.appendChild(toast);
        this.current = toast;
    }
}

export const toasts = ToastManager.instance;
