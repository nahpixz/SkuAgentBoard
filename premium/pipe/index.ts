import { JSX } from "react"

export {} from './*'

export const createPipe = <Tin, TcurOut = null>(initStep?: ProcessStep<Tin, TcurOut, null>) => {
    const steps: ProcessStep<Tin>[] = initStep ? [initStep]: []
    const pipe: Pipe<Tin, TcurOut> = {
        addStep<TstepOut>(step: ProcessStep<Tin, TstepOut, TcurOut>) {
            steps.push(step)
            return pipe as unknown as Pipe<Tin, TstepOut>
        },
        get steps() {
            return steps
        }
    }
    return pipe
}

export type Pipe<Tin, TcurOut> = {
    addStep<TstepOut>(step: ProcessStep<Tin, TstepOut, TcurOut>): Pipe<Tin, TstepOut>;
    get steps(): ProcessStep<Tin>[];
}

export type ProcessStep<Tin, Tout = any, Tprev = any> = {
    id: string;
    name: string;
    description: string;
    process: (item: Tin, prev?: Tprev) => Promise<Tout>;
    render?:(result:Tout)=> JSX.Element;
}