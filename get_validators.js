const { Connection, clusterApiUrl } = require('@solana/web3.js')

const main = async () => {
    const connection = new Connection(clusterApiUrl('devnet', 'processed'));
    const { current, delinquent } = await connection.getVoteAccounts();
    console.log(`All validators: ${current.concat(delinquent).length}`)
    console.log(`Current validators: ${current.length}`);
}

const runMain = async () =>{
    try {
        await main();
    } catch (error) {
        console.log(error)
    }
}

runMain();