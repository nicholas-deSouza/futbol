"use client";

import type { PathResult } from "@/types";
import styles from "./ConnectionPath.module.css";

interface ConnectionPathProps {
  result: PathResult;
}

export function ConnectionPath({ result }: ConnectionPathProps) {
  if (!result.found) {
    return (
      <div className={styles.noConnection}>
        <div className={styles.noConnectionIcon}>?</div>
        <h3>No Connection Found</h3>
        <p>These players don&apos;t appear to be connected through club teammates.</p>
      </div>
    );
  }

  const { path, degrees, stats } = result;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {degrees === 0
            ? "Same Player!"
            : `${degrees} Degree${degrees === 1 ? "" : "s"} of Separation`}
        </h2>
        <p className={styles.stats}>
          Found in {stats.executionTimeMs}ms ({stats.nodesExplored.toLocaleString()}{" "}
          players searched)
        </p>
      </div>

      <div className={styles.pathContainer}>
        <div className={styles.path}>
          {path.map((step, index) => (
            <div key={step.player.id} className={styles.stepWrapper}>
              {/* Connection edge (shows before the player, except for first) */}
              {step.connection && (
                <div className={styles.edge}>
                  <div className={styles.edgeLine} />
                  <div className={styles.edgeLabel}>
                    <span className={styles.clubName}>{step.connection.club}</span>
                    <span className={styles.season}>{step.connection.season}</span>
                  </div>
                  <div className={styles.edgeLine} />
                </div>
              )}

              {/* Player node */}
              <div className={styles.node}>
                <div className={styles.nodeImage}>
                  {step.player.imageUrl ? (
                    <img
                      src={step.player.imageUrl}
                      alt={step.player.name}
                      className={styles.playerPhoto}
                    />
                  ) : (
                    <div className={styles.placeholderPhoto}>
                      {step.player.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className={styles.nodeInfo}>
                  <span className={styles.playerName}>{step.player.name}</span>
                  {step.player.position && (
                    <span className={styles.position}>{step.player.position}</span>
                  )}
                </div>
                {index === 0 && <span className={styles.badge}>Start</span>}
                {index === path.length - 1 && index !== 0 && (
                  <span className={styles.badge}>End</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
