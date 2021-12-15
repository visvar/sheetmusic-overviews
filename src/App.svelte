<script>
    import TopAppBar, { Row, Section, Title } from "@smui/top-app-bar";
    import IconButton from "@smui/icon-button";
    import SegmentedButton, { Segment } from "@smui/segmented-button";
    import { Label } from "@smui/common";

    import "svelte-material-ui/bare.css";
    import Filter from "./Filter.svelte";
    import TileGrid from "./TileGrid.svelte";
    import BubbleChart from "./BubbleChart.svelte";

    // View
    let views = ["Tiles", "Bubble", "PCP"];
    let currentView = "Tiles";

    // Filter
    let minYear;
    let maxYear;
    let venues;
    let modalities;
    const updateFilter = () => {
        if (!allData) {
            return;
        }
        const venueSet = new Set(venues);
        data = allData.filter((d) => {
            return (
                d.year >= minYear &&
                d.year <= maxYear &&
                venueSet.has(d.conference)
            );
        });
        console.log(data);
    };
    // Update data when filter variables change
    $: if (minYear || maxYear || venues || modalities) {
        updateFilter();
    }

    // Data loading
    let loading = false;
    let allData = null;
    let data = null;
    const loadData = async () => {
        loading = true;
        const response = await fetch("./data.json");
        data = await response.json();
        allData = data;
        if (response.ok) {
            loading = false;
        } else {
            throw new Error(text);
        }
    };
    loadData();
</script>

<div class="flexy">
    <div
        class="top-app-bar-container flexor"
        style={`height:${window.innerHeight}px`}
    >
        <TopAppBar
            variant="static"
            prominent={false}
            dense={true}
            color="primary"
        >
            <Row>
                <Section>
                    <IconButton class="material-icons">menu</IconButton>
                    <Title>VR/AR Avatar Survey</Title>
                </Section>
                <Section align="center" toolbar>
                    <SegmentedButton
                        segments={views}
                        singleSelect
                        let:segment
                        bind:selected={currentView}
                    >
                        <Segment {segment}>
                            <Label>{segment}</Label>
                        </Segment>
                    </SegmentedButton>
                </Section>
                <Section align="end" toolbar>
                    <IconButton
                        class="material-icons"
                        aria-label="Bookmark this page">bookmark</IconButton
                    >
                </Section>
            </Row>
        </TopAppBar>
        <div class="flexor-content">
            <main>
                {#if loading === true}
                    Loading...
                {:else if data !== null}
                    <Filter
                        {data}
                        bind:minYear
                        bind:maxYear
                        bind:selectedVenues={venues}
                    />
                    {#if currentView === "Tiles"}
                        <TileGrid {data} />
                    {:else if currentView === "Bubble"}
                        <BubbleChart {data} />
                    {/if}
                {/if}
            </main>
        </div>
    </div>
</div>

<style>
    .top-app-bar-container {
        width: 100%;
        margin: 0 0 0 0;
        overflow: auto;
        display: inline-block;
        /* border: 1px solid            var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.1)); */
        background-color: var(--mdc-theme-background, #fff);
    }

    @media (max-width: 480px) {
        .top-app-bar-container {
            margin-right: 0;
        }
    }

    .flexy {
        display: flex;
        flex-wrap: wrap;
    }

    .flexor {
        display: inline-flex;
        flex-direction: column;
    }

    .flexor-content {
        flex-basis: 0;
        flex-grow: 1;
        overflow: auto;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    main {
        display: grid;
        grid-template-columns: 320px auto;
    }
</style>
