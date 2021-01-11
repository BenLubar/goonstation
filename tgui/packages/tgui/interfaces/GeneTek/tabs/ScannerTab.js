/**
 * @file
 * @copyright 2021
 * @author BenLubar (https://github.com/BenLubar)
 * @license ISC
 */

import { Fragment } from "inferno";
import { useBackend, useSharedState } from "../../../backend";
import { Box, Button, Flex, LabeledList, Modal, Section } from "../../../components";
import { GeneList } from "../BioEffect";
import { GeneIcon } from "../GeneIcon";

export const ScannerTab = (props, context) => {
  const { data, act } = useBackend(context);
  let [changingMutantRace, setChangingMutantRace] = useSharedState(context, "changingmutantrace", false);
  const {
    haveScanner,
    haveSubject,
    subjectName,
    subjectHealth,
    subjectHuman,
    subjectAge,
    subjectBloodType,
    subjectMutantRace,
    subjectCanAppearance,
    subjectPremature,
    subjectPotential,
    subjectActive,
    equipmentCooldown,
    mutantRaces,
  } = data;

  if (changingMutantRace
    && (!haveSubject || !subjectHuman || subjectPremature)) {
    changingMutantRace = false;
    setChangingMutantRace(false);
  }

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
      {!!changingMutantRace && (
        <Modal>
          <Box bold width={20} mb={0.5}>
            Change to which body type?
          </Box>
          {mutantRaces.map(mr => (
            <Box key={mr.ref}>
              <Button
                color="blue"
                disabled={subjectMutantRace === mr.name}
                mt={0.5}
                onClick={() => {
                  setChangingMutantRace(false);
                  act("mutantrace", { ref: mr.ref });
                }}>
                <GeneIcon
                  name={mr.icon}
                  size={1.5}
                  style={{
                    "margin": "-4px",
                    "margin-right": "4px",
                  }} />
                {mr.name}
              </Button>
            </Box>
          ))}
          <Box mt={1} textAlign="right">
            <Button
              color="bad"
              icon="times"
              onClick={() => setChangingMutantRace(false)}>
              Cancel
            </Button>
          </Box>
        </Modal>
      )}
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
                      onClick={() => setChangingMutantRace(true)}>
                      Change
                    </Button>
                    <Button
                      icon="wrench"
                      color="average"
                      disabled={!subjectCanAppearance}
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
          {!!subjectHuman && (
            <Flex.Item grow={0} shrink={0}>
              <Box width="80px" height="80px" textAlign="center">
                <img
                  src={"genetek-scanner-occupant.png?" + Date.now()}
                  style={{
                    "-ms-interpolation-mode": "nearest-neighbor",
                    "image-rendering": "pixelated",
                  }}
                  height="80" />
              </Box>
            </Flex.Item>
          )}
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
