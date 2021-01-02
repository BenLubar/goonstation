/**
 * @file
 * @copyright 2020
 * @author BenLubar (https://github.com/BenLubar)
 * @license ISC
 */

import { Fragment } from "inferno";
import { useBackend, useSharedState } from "../backend";
import { AnimatedNumber, Box, Button, Divider, Flex, Icon, Knob, LabeledList, Modal, NoticeBox, ProgressBar, Section, Tabs, TimeDisplay } from "../components";
import { Window } from "../layouts";

const formatSeconds = v => v > 0 ? (v / 10).toFixed(0) + "s" : "Ready";

export const GeneTek = (props, context) => {
  const { data, act } = useBackend(context);
  const [menu, setMenu] = useSharedState(context, "menu", "research");
  const [buyMats, setBuyMats] = useSharedState(context, "buymats", null);
  const [isCombining, setIsCombining] = useSharedState(context, "iscombining", false);
  const {
    materialCur,
    materialMax,
    currentResearch,
    equipmentCooldown,
    haveSubject,
    subjectName,
    subjectStat,
    subjectHealth,
    subjectStability,
    costPerMaterial,
    budget,
    record,
    scannerAlert,
    scannerError,
  } = data;

  if (!record && menu === "record") {
    setMenu("storage");
  }

  const maxBuyMats = Math.min(
    materialMax - materialCur,
    Math.floor(budget / costPerMaterial),
  );

  return (
    <Window
      theme="genetek"
      width={730}
      height={415}>
      <Window.Content scrollable>
        <Box ml="250px">
          <Tabs>
            <Tabs.Tab
              icon="flask"
              selected={menu === "research"}
              onClick={() => setMenu("research")}>
              Research
            </Tabs.Tab>
            <Tabs.Tab
              icon="radiation"
              selected={menu === "mutations"}
              onClick={() => setMenu("mutations")}>
              Mutations
            </Tabs.Tab>
            <Tabs.Tab
              icon="server"
              selected={menu === "storage"}
              onClick={() => setMenu("storage")}>
              Storage
            </Tabs.Tab>
            {!!record && (
              <Tabs.Tab
                icon="save"
                selected={menu === "record"}
                onClick={() => setMenu("record")}
                rightSlot={menu === "record" && (
                  <Button
                    circular
                    compact
                    color="transparent"
                    icon="times"
                    onClick={() => {
                      act("clearrecord");
                      setMenu("storage");
                    }} />
                )}>
                Record
              </Tabs.Tab>
            )}
            {!!haveSubject && (
              <Tabs.Tab
                icon="dna"
                selected={menu === "scanner"}
                onClick={() => setMenu("scanner")}>
                Scanner
              </Tabs.Tab>
            )}
          </Tabs>
          {buyMats !== null && <BuyMaterialsModal maxAmount={maxBuyMats} />}
          {!!isCombining && <CombineGenesModal />}
          {menu === "research" && <ResearchTab maxBuyMats={maxBuyMats} setBuyMats={setBuyMats} />}
          {menu === "mutations" && <MutationsTab />}
          {menu === "storage" && <StorageTab />}
          {menu === "record" && <RecordTab />}
          {menu === "scanner" && <ScannerTab />}
        </Box>
        <Flex
          width="245px"
          direction="column"
          height="370px"
          position="fixed"
          top="37px"
          left="5px"
          bottom="5px">
          <Flex>
            <ProgressBar
              value={materialCur}
              maxValue={materialMax}
              mb={1}>
              <Box position="absolute" bold>Materials</Box>
              {materialCur}
              {" / "}
              {materialMax}
            </ProgressBar>
            <Flex.Item grow={0} shrink={0} ml={1}>
              <Button
                circular
                compact
                icon="dollar-sign"
                disabled={maxBuyMats <= 0}
                onClick={() => setBuyMats(1)} />
            </Flex.Item>
          </Flex>
          {!!haveSubject && (
            <LabeledList>
              <LabeledList.Item label="Occupant">
                {subjectName}
              </LabeledList.Item>
              <LabeledList.Item label="Health">
                <ProgressBar
                  ranges={{
                    bad: [-Infinity, 0.15],
                    average: [0.15, 0.75],
                    good: [0.75, Infinity],
                  }}
                  value={subjectHealth}>
                  {subjectStat < 2 ? subjectHealth <= 0 ? (
                    <Box color="bad">
                      <Icon name="exclamation-triangle" />
                      {" Critical"}
                    </Box>
                  ) : (subjectHealth * 100).toFixed(0) + "%" : (
                    <Box>
                      <Icon name="skull" />
                      {" Deceased"}
                    </Box>
                  )}
                </ProgressBar>
              </LabeledList.Item>
              <LabeledList.Item label="Stability">
                <ProgressBar
                  ranges={{
                    bad: [-Infinity, 15],
                    average: [15, 75],
                    good: [75, Infinity],
                  }}
                  value={subjectStability}
                  maxValue={100} />
              </LabeledList.Item>
            </LabeledList>
          )}
          <Divider />
          <Flex.Item grow={1} style={{ overflow: "hidden" }}>
            {currentResearch.map(r => (
              <ProgressBar
                key={r.ref}
                value={r.total - r.current}
                maxValue={r.total}
                mb={1}>
                <Box position="absolute">
                  {r.name}
                </Box>
                <TimeDisplay
                  timing
                  value={r.current}
                  format={formatSeconds}
                />
              </ProgressBar>
            ))}
          </Flex.Item>
          {!!scannerAlert && (
            <NoticeBox info={!scannerError} danger={!!scannerError}>
              {scannerAlert}
            </NoticeBox>
          )}
          <Divider />
          <LabeledList>
            {equipmentCooldown.map(e => (
              <LabeledList.Item key={e.label} label={e.label}>
                {e.cooldown < 0 ? "Ready" : (
                  <TimeDisplay
                    timing
                    value={e.cooldown}
                    format={formatSeconds}
                  />
                )}
              </LabeledList.Item>
            ))}
          </LabeledList>
        </Flex>
      </Window.Content>
    </Window>
  );
};

const BuyMaterialsModal = (props, context) => {
  const { data, act } = useBackend(context);
  let [buyMats, setBuyMats] = useSharedState(context, "buymats", null);
  const maxBuyMats = props.maxAmount;
  const {
    budget,
    costPerMaterial,
  } = data;

  buyMats = Math.min(buyMats, maxBuyMats);

  return (
    <Modal>
      <Box
        position="relative"
        width={18}>
        <Box
          position="absolute"
          right={1}
          top={0}>
          <Knob
            inline
            value={buyMats}
            onChange={(e, value) => setBuyMats(value)}
            minValue={1}
            maxValue={maxBuyMats} />
        </Box>
        <LabeledList>
          <LabeledList.Item label="Purchase">
            {buyMats}
            {buyMats === 1 ? " Material " : " Materials "}
          </LabeledList.Item>
          <LabeledList.Item label="Budget">
            {budget}{" Credits"}
          </LabeledList.Item>
          <LabeledList.Item label="Cost">
            {buyMats * costPerMaterial}{" Credits"}
          </LabeledList.Item>
          <LabeledList.Divider />
          <LabeledList.Item label="Remainder">
            <Box inline color={budget - buyMats * costPerMaterial < 0 && "bad"}>
              {budget - buyMats * costPerMaterial}
            </Box>
            {" Credits"}
          </LabeledList.Item>
        </LabeledList>
        <Divider hidden />
        <Box inline width="50%" textAlign="center">
          <Button
            color="good"
            icon="dollar-sign"
            disabled={buyMats <= 0}
            onClick={() => {
              act("purchasematerial", { amount: buyMats });
              setBuyMats(null);
            }}>
            Submit
          </Button>
        </Box>
        <Box inline width="50%" textAlign="center">
          <Button
            color="bad"
            icon="times"
            onClick={() => setBuyMats(null)}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

const CombineGenesModal = (props, context) => {
  const { data, act } = useBackend(context);
  const [isCombining, setIsCombining] = useSharedState(context, "iscombining", false);
  const {
    savedMutations,
    combining = [],
  } = data;

  return (
    <Modal>
      <Box width={16} mr={2}>
        <Box bold mb={2}>
          Select genes to combine
        </Box>
        <Box mb={2}>
          {savedMutations.map(g => (
            <Box key={g.ref}>
              {combining.indexOf(g.ref) >= 0 ? (
                <Button
                  icon="blank"
                  color="grey"
                  onClick={() => act("togglecombine", { ref: g.ref })} />
              ) : (
                <Button
                  icon="check"
                  color="blue"
                  onClick={() => act("togglecombine", { ref: g.ref })} />
              )}
              {" " + g.name}
            </Box>
          ))}
        </Box>
        <Box inline width="50%" textAlign="center">
          <Button
            icon="sitemap"
            disabled={!combining.length}
            onClick={() => {
              act("combinegenes");
              setIsCombining(false);
            }}>
            Combine
          </Button>
        </Box>
        <Box inline width="50%" textAlign="center">
          <Button
            color="bad"
            icon="times"
            onClick={() => setIsCombining(false)}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

const ResearchTab = (props, context) => {
  const { data, act } = useBackend(context);
  const {
    materialCur,
    materialMax,
    budget,
    mutationsResearched,
    autoDecryptors,
    saveSlots,
    availableResearch,
    finishedResearch,
    savedMutations,
  } = data;

  const {
    maxBuyMats,
    setBuyMats,
  } = props;

  return (
    <Fragment>
      <Section
        title="Statistics"
        buttons={(
          <Button
            icon="dollar-sign"
            disabled={maxBuyMats <= 0}
            onClick={() => setBuyMats(1)}>
            Purchase Additional Materials
          </Button>
        )}>
        <LabeledList>
          <LabeledList.Item label="Research Materials">
            {materialCur}{" / "}{materialMax}
          </LabeledList.Item>
          <LabeledList.Item label="Research Budget">
            <AnimatedNumber value={budget} />
            {" Credits"}
          </LabeledList.Item>
          <LabeledList.Item label="Mutations Researched">
            {mutationsResearched}
          </LabeledList.Item>
          {saveSlots > 0 && (
            <LabeledList.Item label="Mutations Stored">
              {savedMutations.length}{" / "}{saveSlots}
            </LabeledList.Item>
          )}
          <LabeledList.Item label="Auto-Decryptors">
            {autoDecryptors}
          </LabeledList.Item>
        </LabeledList>
      </Section>
      <Section title="Available Research">
        {availableResearch.map((ar, tier) => (
          <Section
            key={tier}
            level={2}
            title={"Tier " + (tier + 1)}>
            {ar.length ? ar.map(r => (
              <Section
                key={r.ref}
                title={r.name}
                buttons={
                  <Button
                    icon="flask"
                    disabled={materialCur < r.cost}
                    onClick={() => act("research", { ref: r.ref })}
                    color="teal">
                    {"Research (" + r.cost + " mat, " + r.time + "s)"}
                  </Button>
                }>
                <Description text={r.desc} />
              </Section>
            )) : "No research is currently available at this tier."}
          </Section>
        ))}
      </Section>
      <Section title="Finished Research">
        {finishedResearch.map((fr, tier) => (
          <Section
            key={tier}
            level={2}
            title={"Tier " + (tier + 1)}>
            {fr.length ? fr.map(r => (
              <Section
                key={r.name}
                title={r.name}>
                <Description text={r.desc} />
              </Section>
            )) : "No research has been completed at this tier."}
          </Section>
        ))}
      </Section>
    </Fragment>
  );
};

const MutationsTab = (props, context) => {
  const { data } = useBackend(context);
  const {
    bioEffects,
  } = data;

  bioEffects.sort((a, b) => a.time - b.time);

  return bioEffects.filter(be => be.research >= 1).map(be => (
    <BioEffect
      key={be.ref}
      gene={be} />
  ));
};

const StorageTab = (props, context) => {
  const { data, act } = useBackend(context);
  const [menu, setMenu] = useSharedState(context, "menu", "research");
  const [isCombining, setIsCombining] = useSharedState(context, "iscombining", false);
  const {
    saveSlots,
    samples,
    savedMutations,
    savedChromosomes,
    toSplice,
  } = data;

  const chromosomes = Object.values(savedChromosomes.reduce((p, c) => {
    if (!p[c.name]) {
      p[c.name] = {
        name: c.name,
        desc: c.desc,
        count: 0,
      };
    }

    p[c.name].count++;
    p[c.name].ref = c.ref;

    return p;
  }, {}));
  chromosomes.sort((a, b) => a.name > b.name ? 1 : -1);

  return (
    <Fragment>
      <Section title="DNA Samples">
        <LabeledList>
          {samples.map(s => (
            <LabeledList.Item
              key={s.ref}
              label={s.name}
              buttons={
                <Button
                  icon="save"
                  onClick={() => {
                    act("setrecord", { ref: s.ref });
                    setMenu("record");
                  }}>
                  View Record
                </Button>
              }>
              <tt>{s.uid}</tt>
            </LabeledList.Item>
          ))}
        </LabeledList>
      </Section>
      {saveSlots > 0 && (
        <Section
          title="Stored Mutations"
          buttons={
            <Button
              icon="sitemap"
              onClick={() => setIsCombining(true)}>
              Combine
            </Button>
          }>
          {savedMutations.length ? savedMutations.map(g => (
            <BioEffect
              key={g.ref}
              gene={g}
              isStorage />
          )) : "There are no mutations in storage."}
        </Section>
      )}
      <Section title="Stored Chromosomes">
        {chromosomes.length ? (
          <LabeledList>
            {chromosomes.map(c => (
              <LabeledList.Item
                key={c.ref}
                label={c.name}
                buttons={
                  <Fragment>
                    <Button
                      disabled={c.name === toSplice}
                      icon="map-marker-alt"
                      onClick={() => act("splicechromosome", { ref: c.ref })}>
                      Splice
                    </Button>
                    <Button
                      color="bad"
                      icon="trash"
                      onClick={() => act("deletechromosome", { ref: c.ref })} />
                  </Fragment>
                }>
                {c.desc}
                <Box mt={0.5}>
                  <Box inline color="grey">Stored Copies:</Box> {c.count}
                </Box>
              </LabeledList.Item>
            ))}
          </LabeledList>
        ) : "There are no chromosomes in storage."}
      </Section>
    </Fragment>
  );
};

const RecordTab = (props, context) => {
  const { data } = useBackend(context);
  const {
    record,
  } = data;

  if (!record) {
    return;
  }

  const {
    name,
    uid,
    genes,
  } = record;

  return (
    <Fragment>
      <Section title={name}>
        <LabeledList>
          <LabeledList.Item label="Genetic Signature">
            <tt>{uid}</tt>
          </LabeledList.Item>
        </LabeledList>
      </Section>
      <Section>
        <GeneList
          genes={genes}
          noGenes="No genes found in sample."
          isSample />
      </Section>
    </Fragment>
  );
};

const ScannerTab = (props, context) => {
  const { data, act } = useBackend(context);
  const {
    haveScanner,
    haveSubject,
    subjectName,
    subjectHealth,
    subjectHuman,
    subjectAge,
    subjectBloodType,
    subjectMutantRace,
    subjectPremature,
    subjectPotential,
    subjectActive,
    equipmentCooldown,
  } = data;

  if (!haveSubject) {
    return (
      <Section title="Scanner Error">
        {haveScanner ? "Subject has absconded." : "Check connection to scanner."}
      </Section>
    );
  }

  const haveDevice = {
    Injectors: false,
    Analyzer: false,
    Emitter: false,
    Reclaimer: false,
  };
  const onCooldown = {
    Injectors: true,
    Analyzer: true,
    Emitter: true,
    Reclaimer: true,
  };
  for (const { label, cooldown } of equipmentCooldown) {
    haveDevice[label] = true;
    onCooldown[label] = cooldown > 0;
  }

  return (
    <Fragment>
      <Section title="Occupant">
        <Flex>
          <Flex.Item mr={1}>
            <LabeledList>
              <LabeledList.Item
                label="Name"
                buttons={haveDevice.Emitter && (
                  <Button
                    icon="radiation"
                    disabled={onCooldown.Emitter || subjectHealth <= 0}
                    color="bad"
                    onClick={() => act("emitter")}>
                    Scramble DNA
                  </Button>
                )}>
                {subjectName}
              </LabeledList.Item>
              <LabeledList.Item
                label="Body Type"
                buttons={!!subjectHuman && (
                  <Fragment>
                    <Button
                      icon="user"
                      color="blue"
                      disabled={!!subjectPremature}
                      onClick={() => act("mutantrace")}>
                      Change
                    </Button>
                    <Button
                      icon="wrench"
                      color="average"
                      disabled={subjectMutantRace !== "Human"}
                      onClick={() => act("editappearance")} />
                  </Fragment>
                )}>
                {subjectMutantRace}
              </LabeledList.Item>
              <LabeledList.Item
                label="Physical Age">
                {subjectAge} years
              </LabeledList.Item>
              <LabeledList.Item label="Blood Type">
                {subjectBloodType}
              </LabeledList.Item>
            </LabeledList>
          </Flex.Item>
          <Flex.Item grow={0} shrink={0}>
            <Box
              width="80px"
              height="80px"
              backgroundColor="olive">
              TODO: character sprite or whatevs
            </Box>
          </Flex.Item>
        </Flex>
      </Section>
      <Section title="Potential Genes">
        <GeneList
          genes={subjectPotential}
          noGenes="All detected potential mutations are active."
          isPotential />
      </Section>
      <Section title="Active Mutations">
        <GeneList
          genes={subjectActive}
          noGenes="Subject has no detected mutations."
          isActive />
      </Section>
    </Fragment>
  );
};

const GeneList = (props, context) => {
  const { data, act } = useBackend(context);
  const {
    activeGene,
  } = data;
  const {
    genes,
    noSelection,
    noGenes,
    ...rest
  } = props;
  const ag = genes.find(g => g.ref === activeGene);

  return (
    <Fragment>
      <Flex wrap mb={1}>
        {genes.map(g => (
          <Flex.Item
            key={g.ref}
            grow={1}
            textAlign="center">
            <Button
              icon={g.research >= 2 ? "flask"
                : g.research >= 1 ? "hourglass"
                  : "question"}
              color={g.ref === activeGene ? "black"
                : g.research >= 3 ? "good"
                  : g.research >= 2 ? "teal"
                    : g.research >= 1 ? "average"
                      : "grey"}
              onClick={() => act("setgene", { ref: g.ref })}
              tooltip={g.research === 1 ? "Researching..." : g.name}
              tooltipPosition="left"
              width="80%" />
          </Flex.Item>
        ))}
      </Flex>
      {genes.length ? ag ? (
        <BioEffect
          key={ag.ref}
          gene={ag}
          {...rest} />
      ) : (noSelection || "Select a gene to view it.")
        : (noGenes || "No genes found.")}
    </Fragment>
  );
};

const Description = (props, context) => {
  const lines = props.text.split(/<br ?\/?>/g);

  return lines.map((line, i) => (
    <p key={i}>
      {line}
    </p>
  ));
};

const BioEffect = (props, context) => {
  const { data, act } = useBackend(context);
  const {
    materialCur,
    researchCost,
    equipmentCooldown,
    saveSlots,
    savedMutations,
    haveSubject,
    subjectStat,
    boothCost,
    injectorCost,
    precisionEmitter,
    toSplice,
  } = data;
  const {
    gene,
    isSample,
    isPotential,
    isActive,
    isStorage,
  } = props;
  const {
    ref,
    name,
    desc,
    research,
    canResearch,
    canInject,
    canScramble,
    canReclaim,
    spliceError,
    dna,
  } = gene;

  const haveDevice = {
    Injectors: false,
    Analyzer: false,
    Emitter: false,
    Reclaimer: false,
  };
  const onCooldown = {
    Injectors: true,
    Analyzer: true,
    Emitter: true,
    Reclaimer: true,
  };
  for (const { label, cooldown } of equipmentCooldown) {
    haveDevice[label] = true;
    onCooldown[label] = cooldown > 0;
  }

  const dnaGood = dna.every(pair => !pair[2]);
  const dnaGoodExceptLocks = dna.every(pair =>
    !pair[2] || pair[3] === "locked");

  return (
    <Section title={name}>
      <Flex>
        <Flex.Item grow={0} shrink={0} mr={1}>
          <Icon
            color={research >= 3 ? "good" : research >= 2 ? "teal" : research >= 1 ? "average" : "bad"}
            name={research >= 2 ? "flask" : research >= 1 ? "hourglass" : "times"} />
          {research >= 2 ? " Researched" : research >= 1 ? " In Progress" : " Not Researched"}
        </Flex.Item>
        <Flex.Item grow={1}>
          <Box textAlign="right">
            {!isActive && !!canResearch && research === 0 && (
              <Button
                icon="flask"
                disabled={researchCost > materialCur}
                onClick={() => act("researchmut", {
                  ref: ref,
                  sample: !!isSample,
                })}
                color="teal">
                Research
              </Button>
            )}
            {isPotential && (
              <Button
                icon="check"
                disabled={!dnaGood}
                onClick={() => act("activate", { ref })}
                color="blue">
                Activate
              </Button>
            )}
            {research >= 3 && !dnaGood && (
              <Button
                icon="magic"
                disabled={dnaGoodExceptLocks}
                onClick={() => act("autocomplete", { ref })}>
                Autocomplete DNA
              </Button>
            )}
            {haveDevice.Analyzer && !dnaGood && isPotential && (
              <Button
                disabled={onCooldown.Analyzer}
                icon="microscope"
                color="average"
                onClick={() => act("analyze", { ref })}>
                Check Stability
              </Button>
            )}
            {haveDevice.Reclaimer && isPotential && !!canReclaim && (
              <Button
                disabled={onCooldown.Reclaimer}
                icon="times"
                color="bad"
                onClick={() => act("reclaim", { ref })}>
                Reclaim
              </Button>
            )}
            {boothCost >= 0 && research >= 2 && (isActive || isStorage) && (
              <Button
                disabled={materialCur < boothCost}
                icon="person-booth"
                color="good"
                onClick={() => act("booth", { ref })}>
                Sell at Booth
              </Button>
            )}
            {!!precisionEmitter && research >= 2
              && isPotential && !!canScramble && (
              <Button
                icon="radiation"
                disabled={onCooldown.Emitter || subjectStat >= 0}
                color="bad"
                onClick={() => act("precisionemitter", { ref })}>
                Scramble Gene
              </Button>
            )}
            {saveSlots > 0 && research >= 2 && isActive && (
              <Button
                disabled={saveSlots <= savedMutations.length}
                icon="save"
                color="average"
                onClick={() => act("save", { ref })}>
                Store
              </Button>
            )}
            {research >= 2 && !!canInject && haveDevice.Injectors && (
              <Button
                disabled={onCooldown.Injectors}
                icon="syringe"
                onClick={() => act("activator", { ref })}>
                Activator
              </Button>
            )}
            {research >= 2 && !!canInject && injectorCost >= 0
              && (isActive || isStorage) && (
              <Button
                disabled={onCooldown.Injectors || materialCur < injectorCost}
                icon="syringe"
                onClick={() => act("injector", { ref })}
                color="bad">
                Injector
              </Button>
            )}
            {(isActive || isStorage) && !!toSplice && (
              <Button
                disabled={!!spliceError}
                icon="map-marker-alt"
                onClick={() => act("splicegene", { ref })}
                tooltip={spliceError}
                tooltipPosition="left">
                Splice
              </Button>
            )}
            {isStorage && (
              <Button
                icon="check"
                onClick={() => act("addstored", { ref })}
                color="blue">
                Add to Occupant
              </Button>
            )}
            {isStorage && haveSubject && (
              <Button
                icon="trash"
                onClick={() => act("deletegene", { ref })}
                color="bad" />
            )}
            <Box inline />
          </Box>
        </Flex.Item>
      </Flex>
      <Description text={desc} />
      <DNASequence {...props} />
    </Section>
  );
};

const letterColor = {
  "?": "grey",
  "A": "red",
  "T": "blue",
  "C": "yellow",
  "G": "green",
};

const typeColor = {
  "": "good",
  "X": "grey",
  "1": "good",
  "2": "olive",
  "3": "average",
  "4": "orange",
  "5": "bad",
};

const DNASequence = (props, context) => {
  const { act } = useBackend(context);
  const {
    gene,
    isPotential,
  } = props;

  const sequence = gene.dna;
  let allGood = true;

  const blocks = [];
  for (let i = 0; i < sequence.length; i++) {
    if (i % 4 === 0) {
      blocks.push([]);
    }

    blocks[blocks.length - 1].push(sequence[i]);

    if (sequence[i][2]) {
      allGood = false;
    }
  }

  const advancePair = i => {
    if (isPotential) {
      act("advancepair", {
        ref: gene.ref,
        pair: i,
      });
    }
  };

  return blocks.map((block, i) => (
    <table key={i} style={{
      display: "inline-table",
      "margin-top": "1em",
      "margin-left": i % 4 === 0 ? "0" : "0.25em",
      "margin-right": i % 4 === 3 ? "0" : "0.25em",
    }}>
      <tr>
        {block.map((pair, j) => (
          <td key={j}>
            <Nucleotide
              letter={pair[0]}
              type={pair[2]}
              mark={pair[3]}
              useLetterColor={allGood}
              onClick={() => advancePair(i * 4 + j + 1)} />
          </td>
        ))}
      </tr>
      <tr>
        {block.map((pair, j) => (
          <td key={j} style={{ "text-align": "center" }}>
            {allGood ? "|" : pair[3] === "locked" ? (
              <Icon
                name="lock"
                color="average"
                onClick={() => advancePair(i * 4 + j + 1)} />
            ) : (
              <Icon name={
                pair[2] === "" ? "check"
                  : pair[2] === "5" ? "times"
                    : "question"
              } color={typeColor[pair[2]]} />
            )}
          </td>
        ))}
      </tr>
      <tr>
        {block.map((pair, j) => (
          <td key={j}>
            <Nucleotide
              letter={pair[1]}
              type={pair[2]}
              mark={pair[3]}
              useLetterColor={allGood}
              onClick={() => advancePair(i * 4 + j + 1)} />
          </td>
        ))}
      </tr>
    </table>
  ));
};

DNASequence.defaultHooks = {
  onComponentShouldUpdate: (lastProps, nextProps) => {
    const a = lastProps.gene.dna;
    const b = nextProps.gene.dna;
    if (a.length !== b.length) {
      return true;
    }
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < 4; j++) {
        if (a[i][j] !== b[i][j]) {
          return true;
        }
      }
    }
    return false;
  },
};

const Nucleotide = props => {
  const {
    letter,
    type,
    mark,
    useLetterColor,
    ...rest
  } = props;

  const color = useLetterColor ? letterColor[letter] : typeColor[type];

  return (
    <Button
      width="1.75em"
      textAlign="center"
      color={color}
      {...rest}>
      {letter}
    </Button>
  );
};
