import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'

export default function CastVoteContent() { 
    return (
        <main className=''>
           <h2 className='font-bold text-2xl mb-4 text-green-500'>Cast your Vote</h2>
            <div className='md:w-2/3 w-full border-[1px] rounded border-gray-600 p-3'>
                <Tabs variant='enclosed'>
                    <TabList>
    <Tab>Senatorial  Ballot</Tab>
    <Tab>Governorship Ballot</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>
      <p>one!</p>
                            <div>
                                <p>Hello world ahdad ad  Hello world ahdad ad Hello world ahdad ad Hello world ahdad ad Hello world ahdad ad Hello world ahdad ad Hello world ahdad ad Hello world ahdad ad Hello world ahdad ad Hello world ahdad ad </p>
                            </div>
    </TabPanel>
    <TabPanel>
      <p>two!</p>
    </TabPanel>
  </TabPanels>
</Tabs>
            </div>
        </main>
    )
}