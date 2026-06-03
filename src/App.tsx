import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  Droplets,
  Eye,
  KeyRound,
  LockKeyhole,
  Network,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { formatTokenAmount, pairIsHealthy, type SupportedNetwork, type WrapperPair } from "./domain/wrapperPair";
import { networkConfigs } from "./config/networks";
import { connectInjectedProvider, readInjectedProvider, type Eip1193Provider } from "./services/providerAdapter";
import { buildLiveDemoPreflight } from "./services/liveDemoPreflight";
import { inspectProviderNetwork, switchProviderNetwork, type ProviderNetworkReadiness } from "./services/providerNetwork";
import { makeConfiguredRegistryDataSource } from "./services/registryClient";
import { buildSubmissionEvidencePacket } from "./services/submissionEvidence";
import { buildSubmissionReadiness, zamaReferenceLinks } from "./services/submissionReadiness";
import { buildWrapperTransactionIntents } from "./services/transactionIntents";
import {
  buildUserDecryptionSigningSession,
  signUserDecryptionSigningSession,
  type UserDecryptionSigningSession,
} from "./services/userDecryptionSigningSession";
import { connectInjectedWallet, inspectInjectedWallet, type WalletReadiness } from "./services/walletReadiness";
import { buildActionPlan, decryptMockBalance } from "./services/wrapperActions";
import "./styles.css";

type PairFilter = SupportedNetwork | "all";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export default function App() {
  const [pairs, setPairs] = useState<WrapperPair[]>([]);
  const [filter, setFilter] = useState<PairFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  const [registryStatus, setRegistryStatus] = useState<string>("loading");
  const [walletReadiness, setWalletReadiness] = useState<WalletReadiness | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [networkReadiness, setNetworkReadiness] = useState<ProviderNetworkReadiness | null>(null);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const [signingSession, setSigningSession] = useState<UserDecryptionSigningSession | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<string>("No user-decryption signature requested.");
  const [signingBusy, setSigningBusy] = useState(false);

  const dataSource = useMemo(() => makeConfiguredRegistryDataSource(), []);

  useEffect(() => {
    dataSource
      .listWrapperPairs()
      .then((nextPairs) => {
        setPairs(nextPairs);
        setSelectedId(nextPairs[0]?.id ?? null);
        setRegistryStatus(dataSource.mode === "chain" ? "chain registry" : "local seeded registry");
      })
      .catch((error: unknown) => {
        setRegistryStatus(error instanceof Error ? error.message : "registry load failed");
      });
  }, [dataSource]);

  useEffect(() => {
    inspectInjectedWallet(typeof window === "undefined" ? null : window.ethereum).then(setWalletReadiness);
  }, []);

  const visiblePairs = useMemo(
    () => pairs.filter((pair) => filter === "all" || pair.network === filter),
    [filter, pairs],
  );
  const selected = pairs.find((pair) => pair.id === selectedId) ?? visiblePairs[0] ?? null;
  const actionPlan = selected ? buildActionPlan(selected) : null;
  const transactionIntents = useMemo(
    () => (selected ? buildWrapperTransactionIntents(selected, walletReadiness?.address ?? null) : []),
    [selected, walletReadiness?.address],
  );
  const liveDemoPreflight = useMemo(
    () => (selected ? buildLiveDemoPreflight(selected, walletReadiness, networkReadiness, transactionIntents) : null),
    [networkReadiness, selected, transactionIntents, walletReadiness],
  );
  const readiness = useMemo(() => buildSubmissionReadiness(dataSource.mode === "chain"), [dataSource.mode]);
  const evidencePacket = useMemo(() => buildSubmissionEvidencePacket(), []);

  useEffect(() => {
    if (!selected) return;
    inspectProviderNetwork(typeof window === "undefined" ? null : window.ethereum, selected.network).then(setNetworkReadiness);
  }, [selected]);

  async function revealBalance(pair: WrapperPair) {
    setDecryptedBalance(await decryptMockBalance(pair));
  }

  async function connectWallet() {
    setWalletConnecting(true);
    setWalletReadiness(await connectInjectedWallet(typeof window === "undefined" ? null : window.ethereum));
    setWalletConnecting(false);
    if (selected) setNetworkReadiness(await inspectProviderNetwork(typeof window === "undefined" ? null : window.ethereum, selected.network));
  }

  async function switchNetwork(network: SupportedNetwork) {
    setNetworkSwitching(true);
    setNetworkReadiness(await switchProviderNetwork(typeof window === "undefined" ? null : window.ethereum, network));
    setNetworkSwitching(false);
  }

  async function prepareUserDecryptionSignature(pair: WrapperPair) {
    setSignatureStatus("Preparing user-decryption typed-data request.");
    try {
      const wallet = await readInjectedProvider(typeof window === "undefined" ? null : window.ethereum);
      const session = buildUserDecryptionSigningSession(pair, wallet);
      setSigningSession(session);
      setSignatureStatus(session.detail);
    } catch (error: unknown) {
      setSigningSession(null);
      setSignatureStatus(error instanceof Error ? error.message : "Failed to prepare user-decryption signing request.");
    }
  }

  async function requestUserDecryptionSignature(pair: WrapperPair) {
    setSigningBusy(true);
    setSignatureStatus("Requesting typed-data signature from the connected wallet.");
    try {
      const wallet = await connectInjectedProvider(typeof window === "undefined" ? null : window.ethereum);
      const session = buildUserDecryptionSigningSession(pair, wallet);
      setSigningSession(session);
      const signature = await signUserDecryptionSigningSession(wallet, session);
      setSignatureStatus(`Wallet returned typed-data signature ${signature.slice(0, 18)}...`);
    } catch (error: unknown) {
      setSignatureStatus(error instanceof Error ? error.message : "Wallet signature request failed.");
    } finally {
      setSigningBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Zama Season 3 Bounty Track</p>
          <h1>Confidential Wrapper Registry</h1>
        </div>
        <div className="status-pill">
          <ShieldCheck aria-hidden="true" size={18} />
          {registryStatus}
        </div>
      </section>

      <section className="control-row" aria-label="Wrapper filters">
        {(["all", "sepolia", "mainnet"] as const).map((option) => (
          <button
            key={option}
            className={filter === option ? "segmented active" : "segmented"}
            onClick={() => setFilter(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </section>

      <section className="workspace">
        <div className="pair-list" aria-label="Wrapper pairs">
          {visiblePairs.map((pair) => (
            <button
              key={pair.id}
              className={selected?.id === pair.id ? "pair-row selected" : "pair-row"}
              onClick={() => {
                setSelectedId(pair.id);
                setDecryptedBalance(null);
                setSigningSession(null);
                setSignatureStatus("No user-decryption signature requested.");
              }}
              type="button"
            >
              <span className="token-route">
                {pair.underlying.symbol} <span>to</span> {pair.confidential.symbol}
              </span>
              <span className="network">{pair.network}</span>
              <span className={pairIsHealthy(pair) ? "health ok" : "health bad"}>
                {pairIsHealthy(pair) ? "verified" : "needs review"}
              </span>
            </button>
          ))}
        </div>

        {selected ? (
          <section className="detail-panel" aria-label="Selected wrapper details">
            <div className="detail-header">
              <div>
                <p className="eyebrow">{selected.network}</p>
                <h2>
                  {selected.underlying.symbol} / {selected.confidential.symbol}
                </h2>
              </div>
              <LockKeyhole aria-hidden="true" size={28} />
            </div>

            <div className="metric-grid">
              <Metric icon={<DatabaseZap size={18} />} label="TVS" value={formatTokenAmount(selected.totalValueShielded, selected.confidential.decimals)} />
              <Metric icon={<RefreshCw size={18} />} label="Rate" value={`1 ${selected.confidential.symbol} = ${selected.rate.toString()} base units`} />
              <Metric icon={<Droplets size={18} />} label="Faucet" value={selected.faucetSupported ? "available" : "not available"} />
              <Metric icon={<CheckCircle2 size={18} />} label="Registry" value={networkConfigs[selected.network].registryAddress} />
            </div>

            <dl className="address-list">
              <div>
                <dt>Underlying token</dt>
                <dd>{selected.underlying.address}</dd>
              </div>
              <div>
                <dt>Confidential token</dt>
                <dd>{selected.confidential.address}</dd>
              </div>
              <div>
                <dt>Wrapper contract</dt>
                <dd>{selected.wrapperAddress}</dd>
              </div>
            </dl>

            <div className="action-bar">
              <button type="button" className="primary-action">
                Wrap / unwrap
              </button>
              <button type="button" className="secondary-action" onClick={() => revealBalance(selected)}>
                <Eye aria-hidden="true" size={17} />
                Decrypt balance
              </button>
            </div>
            {decryptedBalance ? <p className="balance-readout">{decryptedBalance}</p> : null}

            {actionPlan ? (
              <section className="action-plan" aria-label="Execution plan">
                {(["faucet", "wrap", "unwrap", "decrypt"] as const).map((kind) => (
                  <div key={kind}>
                    <h3>{kind}</h3>
                    {actionPlan[kind].map((step) => (
                      <p key={`${kind}-${step.label}`}>
                        <strong>{step.label}</strong>
                        <span>{step.status}</span>
                        {step.detail}
                      </p>
                    ))}
                  </div>
                ))}
              </section>
            ) : null}

            <section className="transaction-intents" aria-label="Unsigned transaction intents">
              <div>
                <p className="eyebrow">Unsigned intents</p>
                <h3>Prepared transaction boundary</h3>
              </div>
              {transactionIntents.map((intent) => (
                <article className="transaction-intent" key={intent.kind}>
                  <div className="transaction-intent-header">
                    <strong>{intent.label}</strong>
                    <span>{intent.status}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Target</dt>
                      <dd>{intent.targetAddress ?? "not available"}</dd>
                    </div>
                    <div>
                      <dt>Method</dt>
                      <dd>{intent.method ?? "not available"}</dd>
                    </div>
                    <div>
                      <dt>Network</dt>
                      <dd>
                        {intent.networkLabel} ({intent.chainId})
                      </dd>
                    </div>
                    <div>
                      <dt>Amount</dt>
                      <dd>{intent.amountLabel ?? "not available"}</dd>
                    </div>
                    <div>
                      <dt>Call data</dt>
                      <dd>{intent.data ?? "requires live relayer data"}</dd>
                    </div>
                  </dl>
                  <p>{intent.note}</p>
                </article>
              ))}
            </section>

            <section className="readiness-panel" aria-label="Submission readiness">
              {liveDemoPreflight ? (
                <div>
                  <h3>Live demo preflight</h3>
                  <div className="preflight-summary">
                    <ShieldCheck aria-hidden="true" size={18} />
                    {liveDemoPreflight.canStartSepoliaTransactions
                      ? "Sepolia faucet, approval, and wrap review are ready."
                      : "Sepolia demo transactions are still gated."}
                  </div>
                  <div className="readiness-grid">
                    {liveDemoPreflight.items.map((item) => (
                      <div className={`readiness-item ${item.status}`} key={item.label}>
                        <span>{item.status}</span>
                        <strong>{item.label}</strong>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <h3>Wallet boundary</h3>
                <div className="wallet-readiness">
                  <div className={`readiness-item ${walletReadiness?.status === "ready" ? "complete" : "external-gate"}`}>
                    <span>{walletReadiness?.status ?? "checking"}</span>
                    <strong>Injected provider</strong>
                    <p>{walletReadiness?.detail ?? "Checking browser provider state."}</p>
                  </div>
                  <div className="wallet-facts">
                    <Metric icon={<Wallet size={18} />} label="Account" value={walletReadiness?.address ?? "not connected"} />
                    <Metric
                      icon={<KeyRound size={18} />}
                      label="User decrypt signature"
                      value={walletReadiness?.canPrepareUserDecryptionSignature ? "ready to prepare" : "blocked"}
                    />
                    <Metric
                      icon={<Network size={18} />}
                      label="Network"
                      value={
                        networkReadiness?.currentChainId
                          ? `chain ${networkReadiness.currentChainId}`
                          : `expects ${networkConfigs[selected.network].chainId}`
                      }
                    />
                    <Metric icon={<ShieldCheck size={18} />} label="Network match" value={networkReadiness?.status ?? "checking"} />
                  </div>
                  <div className="wallet-actions">
                    <button
                      className="secondary-action wallet-connect"
                      disabled={walletConnecting || walletReadiness?.status === "ready"}
                      onClick={() => void connectWallet()}
                      type="button"
                    >
                      <Wallet aria-hidden="true" size={17} />
                      {walletConnecting ? "Connecting" : walletReadiness?.status === "ready" ? "Wallet connected" : "Connect wallet"}
                    </button>
                    <button
                      className="secondary-action wallet-connect"
                      disabled={networkSwitching || networkReadiness?.status === "matched"}
                      onClick={() => void switchNetwork(selected.network)}
                      type="button"
                    >
                      <Network aria-hidden="true" size={17} />
                      {networkSwitching ? "Switching" : `Switch to ${networkConfigs[selected.network].label}`}
                    </button>
                  </div>
                  <p className="network-readout">{networkReadiness?.detail ?? "Checking wallet network state."}</p>
                </div>
              </div>
              <div>
                <h3>User-decryption signing</h3>
                <div className="signing-shell">
                  <div className={`readiness-item ${signingSession?.status === "ready" ? "ready" : "external-gate"}`}>
                    <span>{signingSession?.status ?? "not-prepared"}</span>
                    <strong>EIP-712 request</strong>
                    <p>{signingSession?.detail ?? "Prepare the relayer user-decryption typed-data request after connecting a wallet."}</p>
                  </div>
                  <div className="wallet-actions">
                    <button className="secondary-action wallet-connect" onClick={() => void prepareUserDecryptionSignature(selected)} type="button">
                      <ClipboardList aria-hidden="true" size={17} />
                      Prepare request
                    </button>
                    <button
                      className="secondary-action wallet-connect"
                      disabled={signingBusy}
                      onClick={() => void requestUserDecryptionSignature(selected)}
                      type="button"
                    >
                      <KeyRound aria-hidden="true" size={17} />
                      {signingBusy ? "Requesting" : "Request signature"}
                    </button>
                  </div>
                  {signingSession?.draftSummary ? (
                    <dl className="signing-summary">
                      <div>
                        <dt>Signer</dt>
                        <dd>{signingSession.draftSummary.signerAddress}</dd>
                      </div>
                      <div>
                        <dt>Contracts</dt>
                        <dd>{signingSession.draftSummary.contractAddresses.join(", ")}</dd>
                      </div>
                      <div>
                        <dt>Batch</dt>
                        <dd>
                          {signingSession.draftSummary.totalBitLength} bits for {signingSession.draftSummary.durationDays} days
                        </dd>
                      </div>
                      <div>
                        <dt>Blockers</dt>
                        <dd>{signingSession.blockers.length ? signingSession.blockers.join(", ") : "none"}</dd>
                      </div>
                    </dl>
                  ) : null}
                  <p className="network-readout">{signatureStatus}</p>
                </div>
              </div>
              <div>
                <h3>Submission readiness</h3>
                <div className="readiness-grid">
                  {readiness.map((item) => (
                    <div className={`readiness-item ${item.status}`} key={item.label}>
                      <span>{item.status}</span>
                      <strong>{item.label}</strong>
                      <p>{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3>Evidence packet</h3>
                <div className="evidence-shell">
                  <div className="preflight-summary">
                    <ClipboardList aria-hidden="true" size={18} />
                    {evidencePacket.publicLinks.filter((link) => link.status === "ready").length} public assets ready
                  </div>
                  <div className="evidence-links">
                    {evidencePacket.publicLinks.map((link) => (
                      <a href={link.href} key={link.href} rel="noreferrer" target="_blank">
                        <span>{link.status}</span>
                        {link.label}
                      </a>
                    ))}
                  </div>
                  <div className="command-list" aria-label="Validation commands">
                    {evidencePacket.validationCommands.map((command) => (
                      <code key={command}>{command}</code>
                    ))}
                  </div>
                  <div className="readiness-grid">
                    {evidencePacket.checklist.map((item) => (
                      <div className={`readiness-item ${item.status}`} key={item.label}>
                        <span>{item.status}</span>
                        <strong>{item.label}</strong>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h3>References</h3>
                <ul className="reference-list">
                  {zamaReferenceLinks.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} rel="noreferrer" target="_blank">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
