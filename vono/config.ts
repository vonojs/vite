import {Adaptor} from "./adaptor";
import NodeAdaptor from "./adaptors/node/index";

export type Vono = {
	serverEntry: string,
	adaptor: Adaptor
}

export const createConfig = (config: Partial<Vono> = {}): Vono => {
	return {
		serverEntry: config.serverEntry || "src/server.entry",
		adaptor: config.adaptor || new NodeAdaptor()
	}
}