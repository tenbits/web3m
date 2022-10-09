import di from 'a-di';
import alot from 'alot';
import { Web3Client } from '@dequanto/clients/Web3Client';
import { $require } from '@dequanto/utils/$require';
import { $console } from './$console';
import { $date } from '@dequanto/utils/$date';
import { $block } from '@dequanto/utils/$block';
import { $gas } from '@dequanto/utils/$gas';
import { InputDataUtils } from '@dequanto/contracts/utils/InputDataUtils';
import { TxContract } from '@dequanto/contracts/TxContract';
import { $bigint } from '@dequanto/utils/$bigint';
import { $number } from '@dequanto/utils/$number';
import { $is } from '@dequanto/utils/$is';
import { ITxLogsTransferData } from '@dequanto/txs/receipt/TxLogsTransfer';
import { InternalTokenService } from '@core/services/InternalTokenService';
import { TokenPriceService } from '@dequanto/tokens/TokenPriceService';
import { TxLogParser } from '@dequanto/txs/receipt/TxLogParser';
import type { AbiItem, AbiInput } from 'web3-utils'
import type { Transaction, TransactionReceipt } from 'web3-core';
import { ContractAbiProvider } from '@dequanto/contracts/ContractAbiProvider';
import { IBlockChainExplorer } from '@dequanto/BlockchainExplorer/IBlockChainExplorer';
import { ERC20 } from '@dequanto-contracts/openzeppelin/ERC20';
import { ERC721 } from '@dequanto-contracts/openzeppelin/ERC721';
import { $abiUtils } from '@dequanto/utils/$abiUtils';
import { ERC1155 } from '@dequanto-contracts/openzeppelin/ERC1155';


export namespace $tx {

    export async function log(client: Web3Client, explorer: IBlockChainExplorer, hash: string, tx?: Transaction, receipt?: TransactionReceipt) {
        $require.TxHash(hash, `Not valid hash bold<${hash}>`);
        if (tx == null) {
            $console.toast(`Fetch Tx ${hash}`);
            tx = await client.getTransaction(hash);
            if (tx == null) {
                $console.log(`red<Transaction bold<${hash}> not found (${client.platform})>`)
                return;
            }
        }
        if (receipt == null) {
            $console.toast(`Fetch Tx Receipt ${hash}`);
            receipt = await client.getTransactionReceipt(hash);
            if (receipt == null) {
                $console.log('yellow<Transaction is still not mined>');
            }
        }

        let data = InputDataUtils.split(tx.input ?? '');
        let block = receipt == null
            ? null
            : await client.getBlock(receipt.blockNumber);

        $console.log(`\ncyan<bold<Transaction>>\n`);
        $console.table([
            ['Status', receipt == null ? 'yellow<mining>' : (receipt.status ? 'green<OK>' : 'red<ERROR>')],
            ...(block ? [
                ['Block', `#${block.number} yellow<${$date.format($block.getDate(block), 'dd-MM-yyyy HH:mm:ss')}>`]
            ] : []),
            ['Tx', `cyan<${hash}>`],
            ['From', tx.from],
            ['To', tx.to],
            ['Nonce', tx.nonce],
            ['Value', tx.value?.toString() ?? 0],
            ['Data', ''],
            ...(data.method ? [
                ['   Method', `gray<${data.method}>`],
                ['   Arguments', data.args.map(x => `gray<${x}>`).join('\n')],
            ] : []),
            ['Gas', $gas.formatUsed(tx, receipt)]
        ]);

        let abi: AbiItem[];
        if (data.method) {
            let resolver = new ContractAbiProvider(client, explorer);
            let result = await resolver.getAbi(tx.to);
            abi = result.abiJson;
        }

        let parser = di.resolve(TxLogParser);
        if (abi != null) {
            //parser.topics.register(abi);
        }
        let logs = await parser.parse(receipt);
        let knownLogs = logs.filter(x => x != null);

        let transfers: ITxLogsTransferData[] = knownLogs.filter(x => x.event === 'Transfer');
        if (transfers.length > 0) {
            let tokenService = new InternalTokenService();
            let tokenPriceService = new TokenPriceService(client, explorer);

            console.log('Transfer ev');
            console.dir(transfers);
            console.dir(transfers[0].arguments);

            let IERC721 = new ERC721().abi;
            let IERC1155 = new ERC1155().abi;
            let IERC20 = new ERC20().abi;

            console.log($abiUtils.checkInterfaceOf(abi, IERC721), '???? IERC721');
            console.log($abiUtils.checkInterfaceOf(abi, IERC1155), '???? IERC1155');
            console.log($abiUtils.checkInterfaceOf(abi, IERC20), '???? IERC20');

            let events = await alot(transfers)
                //.filter(x => $is.Address(x.token?.symbol))
                .mapAsync(async (transfer) => {
                    if (transfer.token == null) {

                        let IERC20 = new ERC20(transfer.address, client);
                        if ($abiUtils.checkInterfaceOf(abi, IERC20.abi).ok) {
                            let symbol = await IERC20.symbol();
                            transfer.token = {
                                symbol: symbol,
                                address: transfer.address,
                                type: 'ERC20'
                            };
                        } else {
                            let IERC721 = new ERC721(transfer.address, client);
                            if ($abiUtils.checkInterfaceOf(abi, IERC721.abi).ok) {
                                let [ name, symbol ] = await Promise.all([
                                    IERC721.name(),
                                    IERC721.symbol(),
                                ]);
                                console.log('>>>', name, symbol);

                                transfer.token = {
                                    name: name,
                                    symbol: symbol,
                                    address: transfer.address,
                                    type: 'ERC721'
                                };
                            }
                        }


                        // let IERC721 = new ERC721().abi;
                        // let IERC1155 = new ERC1155().abi;


                        // console.log($abiUtils.isInterfaceOf(abi, IERC721), '???? IERC721');
                        // console.log($abiUtils.isInterfaceOf(abi, IERC1155), '???? IERC1155');
                        // console.log($abiUtils.isInterfaceOf(abi, IERC20), '???? IERC20');
                    }
                    console.log('transfer received', transfer);
                    try {
                        let token = await tokenService.getTokenData(transfer.token.symbol, client, explorer);
                        let price = await tokenPriceService.getPrice(token, {
                            amountWei: transfer.amount
                        });
                        return {
                            ...transfer,
                            token: token,
                            usd: $number.round(price.price ?? 0, 2) || '?'
                        };
                    } catch (error) {
                        return {
                            ...transfer,
                            usd: '?',
                        }
                    }
                })
                .toArrayAsync({ errors: 'include' });

            $console.log(`\ncyan<bold<Transfers>>\n`);
            let cells = events.map(event => {
                console.log(event);
                return [
                    event.token?.symbol,
                    event.from,
                    event.to,
                    event.amount != null
                        ? $bigint.toEther(event.amount, event.token?.decimals ?? 18)
                        : '',
                    `${event.usd}$`,
                ];
            });
            $console.table([
                ['Token', 'From', 'To', 'Amount'],
                ['-----', '----', '--', '------'],
                ...cells
            ]);
        }


        let otherEvents = knownLogs.filter(x => x.event !== 'Transfer');
        if (otherEvents.length > 0) {
            $console.log(`\ncyan<bold<Known Events>>\n`);
            let cells = otherEvents.map(event => {
                return [
                    JSON.stringify(event)
                ];
            });
            $console.table([
                ['Serialized Data'],
                ['----------------'],
                ...cells
            ]);
        }

        if (abi) {
            let txContract = new TxContract(explorer);
            let decodedInput = await txContract.parseTrasactionWithAbi(tx, abi);
            $console.log(`\ncyan<bold<Parameters parsed>>\n`);
            let cells = [
                ['Method', decodedInput.name]
            ];
            for (let key in decodedInput.args) {
                if (/^\d$/.test(key)) {
                    continue;
                }
                let val = decodedInput.args[key];
                if (Array.isArray(val)) {
                    val = val.map(x => x?.toString() ?? '<null>').join('\n');
                }
                cells.push([key, val ?? '<null>']);
            }

            $console.table([
                ...cells
            ]);
        }
    }
}
