import * as OPT from './opts'
import * as COMP from './components/index'
import * as TASK from './agent'

export default{
    OPT,
    COMP,
    TASK,
    ok:!import.meta.env.VITE_FREE_VERSION
}