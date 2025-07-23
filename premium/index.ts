import * as OPT from './opts'
import * as COMP from './components/index'
import * as TASK from './agent'
import * as STORE from './stores'
import * as PIPE from './pipe/index'

export default{
    OPT,
    COMP,
    STORE,
    TASK,
    PIPE,
    ok:!import.meta.env.VITE_FREE_VERSION
}