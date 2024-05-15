import * as vite from "vite"
import { useVFS } from "./mod"
import * as fs from "node:fs/promises"
import * as p from "node:path"
import { init, parse } from 'es-module-lexer';

const isRpcPath = (path: string) => path.endsWith(".rpc.ts") || path.endsWith(".rpc.js") || path.endsWith(".rpc.tsx") || path.endsWith(".rpc.jsx")

const clientRuntime = `
export default function rpc(key, name, path) {
	return async (...args) => {
		try {
			const res = await fetch(path, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({key, name, args}),
			});
			if (!res.ok) {
				return Error(res.statusText);
			}
			return await res.json()
		} catch (e) {
			if (e instanceof Error) {
				return e
			}
			return Error('Unknown error fetching rpc function', name);
		}
	}
}
`

const serverRuntime = `
import manifest from "#vono/rpc/manifest";

export default function rpc(handler, config) {
	if(typeof document !== "undefined") {
		throw Error("RPC definition function imported into client. This is a bug.")
	}
	handler.isRPC = true;
	handler.config = config;
	return handler;
}

const notFound = () => new Response("Not found", {status: 404});

export const middleware = async (request) => {
	try {
		const body = await request.json();
		if(!body.key) {
			return notFound()
		}

		const rpcFile = await manifest[body.key]?.()
		if(!rpcFile) {
			return notFound()
		}

		const endpoint = rpcFile[body.name];

		if(!endpoint){
			return notFound()
		}
		
		let result

		if(typeof endpoint === "function"){
			result = await endpoint(...body.args ?? [])
		} else {
			result = endpoint
		}
	
		return new Response(JSON.stringify(result), {
			headers: {
				'Content-Type': 'application/json',
				'x-vono-rpc': 'true',
			},
		});
	} catch (e) {
		console.warn("RPC Error:", e)
		return new Response("Internal server error", {status: 500});
	}
}
`

export default function rpc(): vite.Plugin {
	const vfs = useVFS()
	let vite: vite.ResolvedConfig | null = null
	let manifest: Record<string, string>

	const generateManifest = async (config: vite.ResolvedConfig) => {
		const result: Record<string, string> = {}
		const files = await fs.readdir(config.root, { recursive: true, withFileTypes: true });
		for(const file of files){
			if(file.isFile() && isRpcPath(file.name)) {
				result[String(Math.random()).substring(2)] = p.join(file.path, file.name);
			}
		}
		return result;
	}

	return {
		name: "rpc",
		enforce: "pre",
		configResolved: async (config) => {
			vite = config
			manifest = await generateManifest(config);
			vfs.add({
				path: "rpc/manifest",
				serverContent: () => `export default {${Object.entries(manifest).map(([k, v]) => `"${k}": () => import("${v}")`).join(",")}}`
			});
			vfs.add({
				path: "rpc",
				serverContent: () => serverRuntime,
				clientContent: () => clientRuntime,
			})
		},
		resolveId: (id) => {
			console.log(id)
			if(id === "server-only"){
				console.log("YES")
			}
		},
		transform: async (code, id, ctx) =>{
			if(ctx?.ssr) {
				return code
			}

			await init;

			if(isRpcPath(id)) {
				const file = Object.entries(manifest).find(([, v]) => v === id)
				if(!file) throw new Error("File not found in manifest")

				const [, exports] = parse(code);

				let result = 'import rpc from "#vono/rpc";\n'

				for(const exp of exports) {
					if(exp.n === "default") {
						result += `export default rpc("${file[0]}", "default", "/__rpc");\n`
					} else {
						result += `export const ${exp.n} = rpc("${file[0]}", "${exp.n}", "/__rpc");\n`
					}
				}

				return {
					code: result,
					map: null
				}
			}

			if(
				!id.endsWith(".ts") &&
				!id.endsWith(".js") &&
				!id.endsWith(".jsx") &&
				!id.endsWith(".tsx")
			) { return; }

			let imports: ReturnType<typeof parse>
			try {
				 imports = parse(code)
			} catch {
				return;
			}

			if(imports.flat().some(imp => typeof imp === "object" && imp.n === "#vono/rpc")){
				console.log(code)
				throw Error(`You are leaking server code into\n${id}\nmost likely because it's not postfixed with .rpc.{ts|js}`)
			}
		},
		handleHotUpdate: async (ctx) => {
			if(isRpcPath(ctx.file)) {
				manifest = await generateManifest(vite!)
				await ctx.server.reloadModule(
					ctx.server.moduleGraph.getModuleById("\0" + "virtual:vfs:/rpc")!
				)
				await ctx.server.reloadModule(
					ctx.server.moduleGraph.getModuleById("\0" + "virtual:vfs:/rpc/manifest")!
				)
			}
		}
	}
}
