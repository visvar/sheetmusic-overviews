<script>
    export let data;

    // import * as d3 from "d3";
    import { groups, schemeTableau10 } from "d3";
    import { children } from "svelte/internal";
    import { BubbleChart } from "./BubbleChart.js";

    const fieldGroups = new Map([
        ["avatar", "representation"],
        ["gesture", "communication"],
        ["facial expression", "communication"],
        ["robot", "representation"],
    ]);

    const showVis = () => {
        const container = document.querySelectorAll("#visualization")[0];
        if (!container) {
            return;
        }
        let fields = groups(
            data.flatMap((p) => p.fieldOfStudy),
            (d) => d
        )
            .sort((a, b) => b[1].length - a[1].length)
            .map(([key, group]) => {
                return {
                    key,
                    count: group.length,
                };
            })
            .filter((d) => d.count > 1);
        // console.log("rendering bubble chart");
        let svg = BubbleChart(fields, {
            // label: (d) => d.key,
            label: (d) => `${d.key.split(" ").join("\n")}\n(${d.count})`,
            value: (d) => d.count,
            group: (d) => fieldGroups.get(d.key),
            title: (d) => `${d.key}\n(${d.count} times)`,
            link: (d) => null,
            width: Math.min(window.innerWidth - 330, window.innerHeight - 100),
            colors: schemeTableau10,
            fillOpacity: 0.5,
        });
        // console.log("appending bubble chart");
        if (container.children.length > 0) {
            container.removeChild(container.children[0]);
        }
        container.appendChild(svg);
    };

    // Work around to update chart when data changes
    $: if (data) {
        showVis();
    }
</script>

<main>
    <div id="visualization" on:load={showVis()} {data} />
</main>
