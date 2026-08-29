"""
clustering.py - DBSCAN-based event clustering for NILM

Groups detected power events by their magnitude using DBSCAN.
Events from the same appliance will have similar |delta_P| values
and naturally cluster together.

Why DBSCAN over K-Means?
- No need to specify number of clusters upfront
- Automatically identifies noise/outliers (cluster = -1)
- Noise points = potentially unknown appliances
"""

import numpy as np
from sklearn.cluster import DBSCAN


def cluster_events(events, eps=15.0, min_samples=2):
    """
    Cluster detected events by their |delta_P| magnitude using DBSCAN.

    Args:
        events: list of event dicts from detect_events()
        eps: max distance between delta_P values to be in same cluster (watts)
             - Too small: many small clusters, real groups get split
             - Too large: everything in one cluster
             - Start with 15.0, lower to 5-10 if appliances have similar wattages
        min_samples: minimum events to form a cluster
             - Use 2 for hackathon (you may not have many events per appliance)

    Returns:
        events list with 'cluster' field added to each event dict
    """
    if len(events) < 2:
        for e in events:
            e["cluster"] = -1
        return events

    # Use absolute delta_p as the single feature for clustering
    X = np.array([[e["abs_delta_p"]] for e in events])

    db = DBSCAN(eps=eps, min_samples=min_samples)
    labels = db.fit_predict(X)

    for i, e in enumerate(events):
        e["cluster"] = int(labels[i])

    # Print summary
    unique_labels = set(labels)
    n_clusters = len(unique_labels - {-1})
    n_noise = list(labels).count(-1)
    print(f"\n[DBSCAN] Found {n_clusters} clusters, {n_noise} noise points")

    for label in sorted(unique_labels):
        if label == -1:
            continue
        members = [e for e in events if e["cluster"] == label]
        avg_dp = np.mean([e["abs_delta_p"] for e in members])
        print(f"  Cluster {label}: {len(members)} events, avg |delta_P| = {avg_dp:.1f}W")

    if n_noise > 0:
        print(f"  Noise: {n_noise} unclassified events (potential unknown appliances)")

    return events
