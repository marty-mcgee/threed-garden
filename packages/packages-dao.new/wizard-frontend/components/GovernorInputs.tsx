import {
  Heading,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  RadioGroup,
  Radio,
} from '@chakra-ui/react'

export const GovernorInputs = ({ governorConfig, onGovernorConfigChange }) => {
  function onGovernorNameChange(e) {
    const newValues = Object.assign({}, governorConfig)
    newValues.name = e.target.value
    onGovernorConfigChange(newValues)
  }

  function onGovernorProposalThresholdChange(v) {
    const newValues = Object.assign({}, governorConfig)
    newValues.proposalThreshold = v
    onGovernorConfigChange(newValues)
  }

  function onGovernorVotingDelayChange(v) {
    const newValues = Object.assign({}, governorConfig)
    newValues.votingDelay = v
    onGovernorConfigChange(newValues)
  }

  function onGovernorVotingPeriodChange(v) {
    const newValues = Object.assign({}, governorConfig)
    newValues.votingPeriod = v
    onGovernorConfigChange(newValues)
  }

  function onGovernorQuorumNumeratorChange(v) {
    const newValues = Object.assign({}, governorConfig)
    newValues.quorumNumerator = v
    onGovernorConfigChange(newValues)
  }

  function onGovernorTimelockDelayChange(v) {
    const newValues = Object.assign({}, governorConfig)
    newValues.timelockDelay = v
    onGovernorConfigChange(newValues)
  }

  function onGovernorTimelockUpgradableChange(v) {
    const newValues = Object.assign({}, governorConfig)
    newValues.upgradable = v === '1'
    onGovernorConfigChange(newValues)
  }

  return (
    <>
      <Heading as="h2" mb={6} mt={6}>
        4. Governor
      </Heading>
      <VStack spacing={6}>
        <FormControl id="governor-name" isRequired>
          <FormLabel>Name</FormLabel>
          <Input
            type="text"
            value={governorConfig.name}
            onChange={onGovernorNameChange}
          />
          <FormHelperText>e.g. Awesome DAO</FormHelperText>
        </FormControl>
        <FormControl id="governor-propthreshold" isRequired>
          <FormLabel>Proposal threshold</FormLabel>
          <NumberInput
            defaultValue={1}
            step={1}
            min={0}
            value={governorConfig.proposalThreshold}
            onChange={onGovernorProposalThresholdChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            How many tokens must someone own before they can submit a proposal
            to the DAO?
          </FormHelperText>
        </FormControl>
        <FormControl id="governor-votingdelay" isRequired>
          <FormLabel>Voting delay (blocks)</FormLabel>
          <NumberInput
            defaultValue={13300}
            step={300}
            min={0}
            value={governorConfig.votingDelay}
            onChange={onGovernorVotingDelayChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            The time between proposal submission and when voting starts. This is
            important time for DAO members to make sense of proposals and form
            an opinion.
          </FormHelperText>
        </FormControl>
        <FormControl id="governor-votingperiod" isRequired>
          <FormLabel>Voting period (blocks)</FormLabel>
          <NumberInput
            defaultValue={46500}
            step={6650}
            min={45}
            value={governorConfig.votingPeriod}
            onChange={onGovernorVotingPeriodChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            The time between proposal when voting starts and ends. This is
            important time for DAO members to make sense of proposals and form
            an opinion. We've set the lower bound to 45 blocks (~10 minutes) to
            give DAO members some minimal time to submit votes before the vote
            is defeated due to insufficient voting.
          </FormHelperText>
        </FormControl>
        <FormControl id="governor-quorumnumerator" isRequired>
          <FormLabel>Quorum numerator (%)</FormLabel>
          <NumberInput
            defaultValue={1}
            step={1}
            min={0}
            max={100}
            value={governorConfig.quorumNumerator}
            onChange={onGovernorQuorumNumeratorChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            The minimal percentage of DAO votes that is required for a proposal
            to succeed.
          </FormHelperText>
        </FormControl>
        <FormControl id="governor-timelockdelay" isRequired>
          <FormLabel>Timelock delay (seconds)</FormLabel>
          <NumberInput
            defaultValue={172800}
            step={3600}
            min={0}
            value={governorConfig.timelockDelay}
            onChange={onGovernorTimelockDelayChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormHelperText>
            The delay between a proposal's success and when its transactions can
            be executed.
          </FormHelperText>
        </FormControl>
        <FormControl id="governon-upgradable" isRequired>
          <FormLabel>Make Governor upgradable?</FormLabel>
          <RadioGroup
            defaultValue="1"
            value={governorConfig.upgradable ? '1' : '0'}
            onChange={onGovernorTimelockUpgradableChange}
          >
            <HStack spacing={8}>
              <Radio value="1">Yes</Radio>
              <Radio value="0">No</Radio>
            </HStack>
          </RadioGroup>
          <FormHelperText>
            This is a tradeoff; choosing Yes makes your DAO more future-proof,
            while choosing No saves gas costs in deploying your Governor
            contracts.
          </FormHelperText>
        </FormControl>
      </VStack>
    </>
  )
}
