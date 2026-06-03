import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, DatabaseZap, Droplets, Eye, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { formatTokenAmount, pairIsHealthy, type SupportedNetwork, type WrapperPair } from "./domain/wrapperPair";
import { networkConfigs } from "./config/networks";
import { makeConfiguredRegistryDataSource } from "./services/registryClient";
import { buildSubmissionReadiness, zamaReferenceLinks } from "./services/submissionReadiness";
import { buildActionPlan, decryptMockBalance } from "./services/wrapperActions";
import "./styles.css";

type PairFilter = SupportedNetwork | "all";

export default function App() {
  const [pairs, setPairs] = useState<WrapperPair[]>([]);
  const [filter, setFilter] = useState<PairFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  const [registryStatus, setRegistryStatus] = useState<string>("loading");

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

  const visiblePairs = useMemo(
    () => pairs.filter((pair) => filter === "all" || pair.network === filter),
    [filter, pairs],
  );
  const selected = pairs.find((pair) => pair.id === selectedId) ?? visiblePairs[0] ?? null;
  const actionPlan = selected ? buildActionPlan(selected) : null;
  const readiness = useMemo(() => buildSubmissionReadiness(dataSource.mode === "chain"), [dataSource.mode]);

  async function revealBalance(pair: WrapperPair) {
    setDecryptedBalance(await decryptMockBalance(pair));
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

            <section className="readiness-panel" aria-label="Submission readiness">
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
