;; governance_chain_contract
;; A DAO governance contract that allows token holders to create and vote on proposals

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-proposal-exists (err u103))
(define-constant err-proposal-expired (err u104))
(define-constant err-already-voted (err u105))
(define-constant err-insufficient-tokens (err u106))

;; Proposal statuses
(define-constant status-active u0)
(define-constant status-passed u1)
(define-constant status-failed u2)
(define-constant status-expired u3)

;; Proposal data structure
(define-map proposals
  uint
  {
    title: (string-utf8 100),
    description: (string-utf8 500),
    proposer: principal,
    start-block-height: uint,
    end-block-height: uint,
    status: uint,
    for-votes: uint,
    against-votes: uint,
    abstain-votes: uint,
    action-contract: principal,
    action-function: (string-ascii 128),
    action-args: (list 10 (string-utf8 100))
  }
)

;; Track votes by proposal ID and voter
(define-map votes
  {proposal-id: uint, voter: principal}
  {vote-type: uint, amount: uint}
)

;; Track token balances at proposal creation (for voting power)
(define-map voting-power-snapshots
  {proposal-id: uint, voter: principal}
  {amount: uint}
)

;; private functions
(define-private (create-proposal-internal
                  (title (string-utf8 100))
                  (description (string-utf8 500))
                  (duration uint)
                  (action-contract principal)
                  (action-function (string-ascii 128))
                  (action-args (list 10 (string-utf8 100))))
  (let ((proposal-id (var-get total-proposals))
        (start-block (unwrap-panic (get-block-info? time u0)))
        (end-block (+ start-block duration)))
    
    (map-set proposals proposal-id
      {
        title: title,
        description: description,
        proposer: tx-sender,
        start-block-height: start-block,
        end-block-height: end-block,
        status: status-active,
        for-votes: u0,
        against-votes: u0,
        abstain-votes: u0,
        action-contract: action-contract,
        action-function: action-function,
        action-args: action-args
      })
    
    (var-set total-proposals (+ proposal-id u1))
    (ok proposal-id)))

(define-private (is-proposal-active (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) false))
        (current-height (unwrap-panic (get-block-info? time u0))))
    (and
      (is-eq (get status proposal) status-active)
      (<= (get start-block-height proposal) current-height)
      (>= (get end-block-height proposal) current-height))))

(define-private (get-voting-power (voter principal))
  ;; In a real implementation, this would query the token contract
  ;; For simplicity, we'll return a fixed value
  u100)

