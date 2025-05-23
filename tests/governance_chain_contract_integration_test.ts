import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

/**
 * Helper function to create a proposal
 */
function createProposal(
  chain: Chain, 
  sender: Account, 
  title: string, 
  description: string, 
  duration: number
): { block: any, proposalId: number } {
  const block = chain.mineBlock([
    Tx.contractCall(
      'governance_chain_contract',
      'create-proposal',
      [
        types.utf8(title),
        types.utf8(description),
        types.uint(duration),
        types.principal(sender.address),
        types.ascii('test-function'),
        types.list([types.utf8('arg1'), types.utf8('arg2')])
      ],
      sender.address
    )
  ]);
  
  // Extract proposal ID from result
  const proposalId = parseInt(block.receipts[0].result.replace('(ok u', '').replace(')', ''));
  return { block, proposalId };
}

/**
 * Helper function to cast a vote
 */
function castVote(
  chain: Chain, 
  sender: Account, 
  proposalId: number, 
  voteType: number, 
  amount: number
): any {
  return chain.mineBlock([
    Tx.contractCall(
      'governance_chain_contract',
      'vote',
      [types.uint(proposalId), types.uint(voteType), types.uint(amount)],
      sender.address
    )
  ]);
}

/**
 * Helper function to get proposal details
 */
function getProposal(chain: Chain, caller: Account, proposalId: number): any {
  const result = chain.callReadOnlyFn(
    'governance_chain_contract',
    'get-proposal',
    [types.uint(proposalId)],
    caller.address
  );
  return result.result.expectSome().expectTuple();
}

/**
 * Helper function to mine multiple blocks
 */
function mineBlocks(chain: Chain, count: number): void {
  for (let i = 0; i < count; i++) {
    chain.mineBlock([]);
  }
}

Clarinet.test({
  name: "Contract Test: Full governance workflow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    const wallet3 = accounts.get('wallet_3')!;
    const wallet4 = accounts.get('wallet_4')!;
    
    console.log("Step 1: Initialize governance parameters");
    // Set total token supply
    let block = chain.mineBlock([
      Tx.contractCall(
        'governance_chain_contract',
        'set-total-token-supply',
        [types.uint(1000)],
        deployer.address
      )
    ]);
    assertEquals(block.receipts[0].result, '(ok true)');
    
    // Set governance token
    block = chain.mineBlock([
      Tx.contractCall(
        'governance_chain_contract',
        'set-governance-token',
        [types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token-contract')],
        deployer.address
      )
    ]);
    assertEquals(block.receipts[0].result, '(ok true)');
    
    console.log("Step 2: Create multiple proposals");
    // Create first proposal
    const proposal1 = createProposal(
      chain, 
      wallet1, 
      "First Proposal", 
      "This is the first test proposal", 
      144
    );
    assertEquals(proposal1.block.receipts[0].result, '(ok u0)');
    
    // Create second proposal
    const proposal2 = createProposal(
      chain, 
      wallet2, 
      "Second Proposal", 
      "This is the second test proposal", 
      200
    );
    assertEquals(proposal2.block.receipts[0].result, '(ok u1)');
    
    // Verify proposal count
    const proposalCount = chain.callReadOnlyFn(
      'governance_chain_contract',
      'get-proposal-count',
      [],
      deployer.address
    );
    assertEquals(proposalCount.result, 'u2');
    
    console.log("Step 3: Vote on first proposal");
    // Cast votes from different wallets
    let voteBlock1 = castVote(chain, wallet1, proposal1.proposalId, 1, 50); // For
    let voteBlock2 = castVote(chain, wallet2, proposal1.proposalId, 1, 100); // For
    let voteBlock3 = castVote(chain, wallet3, proposal1.proposalId, 2, 80); // Against
    let voteBlock4 = castVote(chain, wallet4, proposal1.proposalId, 3, 30); // Abstain
    
    assertEquals(voteBlock1.receipts[0].result, '(ok true)');
    assertEquals(voteBlock2.receipts[0].result, '(ok true)');
    assertEquals(voteBlock3.receipts[0].result, '(ok true)');
    assertEquals(voteBlock4.receipts[0].result, '(ok true)');
    
    // Verify vote tallies
    const proposal1Data = getProposal(chain, deployer, proposal1.proposalId);
    assertEquals(proposal1Data['for-votes'], 'u150');
    assertEquals(proposal1Data['against-votes'], 'u80');
    assertEquals(proposal1Data['abstain-votes'], 'u30');
    
    console.log("Step 4: Vote on second proposal");
    // Cast votes from different wallets
    voteBlock1 = castVote(chain, wallet1, proposal2.proposalId, 2, 50); // Against
    voteBlock2 = castVote(chain, wallet2, proposal2.proposalId, 2, 100); // Against
    voteBlock3 = castVote(chain, wallet3, proposal2.proposalId, 1, 80); // For
    voteBlock4 = castVote(chain, wallet4, proposal2.proposalId, 3, 30); // Abstain
    
    assertEquals(voteBlock1.receipts[0].result, '(ok true)');
    assertEquals(voteBlock2.receipts[0].result, '(ok true)');
    assertEquals(voteBlock3.receipts[0].result, '(ok true)');
    assertEquals(voteBlock4.receipts[0].result, '(ok true)');
    
    // Verify vote tallies
    const proposal2Data = getProposal(chain, deployer, proposal2.proposalId);
    assertEquals(proposal2Data['for-votes'], 'u80');
    assertEquals(proposal2Data['against-votes'], 'u150');
    assertEquals(proposal2Data['abstain-votes'], 'u30');
    
    console.log("Step 5: Test duplicate vote prevention");
    // Try to vote again with wallet1 on proposal1
    const duplicateVote = castVote(chain, wallet1, proposal1.proposalId, 1, 10);
    assertEquals(duplicateVote.receipts[0].result, '(err u105)'); // err-already-voted
    
    console.log("Step 6: Mine blocks to end proposal duration");
    // Mine enough blocks to end the proposals
    mineBlocks(chain, 150);
    
    console.log("Step 7: Finalize first proposal (should be approved)");
    // Finalize first proposal
    block = chain.mineBlock([
      Tx.contractCall(
        'governance_chain_contract',
        'finalize-proposal',
        [types.uint(proposal1.proposalId)],
        deployer.address
      )
    ]);
    assertEquals(block.receipts[0].result, '(ok true)');
    
    // Verify proposal was approved
    const finalizedProposal1 = getProposal(chain, deployer, proposal1.proposalId);
    assertEquals(finalizedProposal1['status'], 'u2'); // status-approved
    
    console.log("Step 8: Finalize second proposal (should be rejected)");
    // Finalize second proposal
    block = chain.mineBlock([
      Tx.contractCall(
        'governance_chain_contract',
        'finalize-proposal',
        [types.uint(proposal2.proposalId)],
        deployer.address
      )
    ]);
    assertEquals(block.receipts[0].result, '(ok true)');
    
    // Verify proposal was rejected
    const finalizedProposal2 = getProposal(chain, deployer, proposal2.proposalId);
    assertEquals(finalizedProposal2['status'], 'u3'); // status-rejected
    
    console.log("Step 9: Execute approved proposal");
    // Execute first proposal
    block = chain.mineBlock([
      Tx.contractCall(
        'governance_chain_contract',
        'execute-proposal',
        [types.uint(proposal1.proposalId)],
        deployer.address
      )
    ]);
    assertEquals(block.receipts[0].result, '(ok true)');
    
    // Verify proposal was executed
    const executedProposal = getProposal(chain, deployer, proposal1.proposalId);
    assertEquals(executedProposal['status'], 'u4'); // status-executed
    
    console.log("Step 10: Try to execute rejected proposal (should fail)");
    // Try to execute second proposal (should fail)
    block = chain.mineBlock([
      Tx.contractCall(
        'governance_chain_contract',
        'execute-proposal',
        [types.uint(proposal2.proposalId)],
        deployer.address
      )
    ]);
    assertEquals(block.receipts[0].result, '(err u102)'); // err-unauthorized
    
    console.log("Step 11: Test owner-only functions");
    // Try to set governance token as non-owner
    block = chain.mineBlock([
      Tx.contractCall(
        'governance_chain_contract',
        'set-governance-token',
        [types.principal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token-contract')],
        wallet1.address
      )
    ]);
    assertEquals(block.receipts[0].result, '(err u100)'); // err-owner-only
    
    console.log("All tests passed!");
  },
});