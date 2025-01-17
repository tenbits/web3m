import { App } from '@core/app/App';
import { $bigint } from '@dequanto/utils/$bigint';
import { BaseService } from './BaseService';

export class RpcService extends BaseService {
    async process(args: any[], params?, app?: App) {

        let client = app.chain.client;
        let [ method, ...methodArgs ] = args as [ string, ...any[]];

        for (let key in params) {
            let argMatch = /^arg(?<index>\d+)$/.exec(key);
            if (argMatch) {
                let index = Number(argMatch.groups.index);
                methodArgs[index] = params[key];
            }
        }

        methodArgs = methodArgs.map(arg => {
            let typeMatch = /(?<type>\w+):/.exec(arg);
            if (typeMatch == null) {
                let type = this.detectType(arg);
                return this.toValue(type, arg)
            }

            /** @TODO add type support*/
            let type = typeMatch.groups.type;
            let value = arg.replace(typeMatch[0], '');
            return this.toValue(type, value);
        });

        let result = await client.with(async wClient => {
            let rpc = wClient.rpc;
            if (method in rpc.fns === false) {
                rpc.extend([{
                    name: method,
                    call: method,
                }]);
            }
            let result = await rpc.fns[method](...methodArgs);
            return result;
        });

        if (typeof result !== 'object') {
            this.printResult(result);
        } else {
            this.printResult(JSON.stringify(result, null, 4))
        };

        return result;
    }

    private toValue(type: 'boolean' | string, str: string) {
        if (type === 'boolean') {
            str = str.toLowerCase();
            if ('true' === str || '1' === str) {
                return true;
            }
            if ('false' === str || '0' === str) {
                return false;
            }
            throw new Error(`Invalid boolean value: ${str}`);
        }
        if (/^uint/.test(str)) {
            try {
                let num = BigInt(str);
                return $bigint.toHex(num);
            } catch (error) {
                throw new Error(`Invalid bigint value: ${str}`);
            }
        }

        return str;
    }
    private detectType (str: string) {
        if (/^\d+$/.test(str)) {
            return 'uint256';
        }
        if (/^(true|false|0|1)$/i.test(str)) {
            return 'boolean';
        }
        return null;
    }
}
