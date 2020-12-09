import path from 'path'
import serve from 'rollup-plugin-serve'
import config from './rollup.config'

process.env.NODE_ENV = 'development';

const resolveFile = function (filePath) {
    return path.join(__dirname, filePath)
}
const PORT = 3001;

const devSite = `http://127.0.0.1:${PORT}`;
const devPath = path.join('', 'index.html');
const devUrl = `${devSite}/${devPath}`;

setTimeout(() => {
    console.log(`[dev]: ${devUrl}`)
}, 1000);


config.output.sourcemap = true;

config.plugins = [
    ...config.plugins,
    ...[
        serve({
            port: PORT,
            contentBase: [resolveFile('')]
        })
    ]
]

export default config