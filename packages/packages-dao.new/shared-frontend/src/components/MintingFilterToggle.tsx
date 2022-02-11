import { FormControl, FormLabel, Switch, Text, VStack } from '@chakra-ui/react'

export const MintingFilterToggle = ({ value, onValueChange }) => {
  const onSwitchChange = (e) => {
    onValueChange(e.target.checked)
  }

  return (
    <VStack spacing={2} alignItems="flex-start">
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="buyer-filtering" mb="0">
          Enable buyer filtering?
        </FormLabel>
        <Switch
          id="buyer-filtering"
          onChange={onSwitchChange}
          isChecked={value}
        />
      </FormControl>
      <Text color="gray.500" fontSize="sm">
        Use this if you want to only allow certain NFT holders to mint your
        token. <br />
        To find the NFT contract address, find it on rarible.com, and copy the
        address just below the collection name.
      </Text>
    </VStack>
  )
}
