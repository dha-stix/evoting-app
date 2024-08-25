"use client"
import { formatDate, getWinner } from '@/app/utils/lib';
import { useEffect, useState, useCallback } from 'react';

export default function VoteCount() { 
  const [elections, setElections] = useState<Election[] | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleToggleInfoSection = (index: number) => setSelectedIndex(index)
  

  const fetchElections = useCallback(async () => {
      const request = await fetch("/api/elections/result")
      const response = await request.json()
      setElections(response.data)
  }, [])
  
  useEffect(() => {
    fetchElections()
   }, [fetchElections])

    return (
        <main className='flex flex-col min-h-[100vh] px-8 py-4 items-center w-full'>
        <h2 className='font-bold text-2xl mb-4'>Real-time Voting Stats</h2>

        {elections && (
          elections.map((election, index) => (
            <div key={election.id} className='w-full mb-3 border-y-[1px]'>
            <div className='w-full flex items-center justify-between bg-gray-50 shadow rounded-md p-4'>
              <section className='w-1/3'>
                <h3 className='font-bold text-green-500'>{election.name}</h3>
                <p className='text-gray-600 text-sm'>{election.description}</p>
              </section>

              <section>
                <h3 className='text-green-500'>Total Voters</h3>
                <p className='text-sm font-bold text-center'>{election.voters ? election.voters.length : 0}</p>
              </section>
               <section>
                  <button className='bg-gray-500 text-white px-4 py-2 rounded-md text-sm'
                    onClick={() => handleToggleInfoSection(index)}>
                    View Results
                  </button>
              </section>
              </div>
              {selectedIndex === index && (
                <section className='w-full border-[1px] rounded-md p-4'>
                  <p className='text-sm mb-3'>Voting Duration: <span className='opacity-60'>{formatDate(election.start_date!)} to {formatDate(election.end_date!)}</span></p>

                  {election.results && JSON.parse(election.results as string).map((result: Result) => (
                    <div key={result.party} className='flex items-center space-x-5'>
                      <p className='text-sm w-1/3'>{`${result.name} (${result.party})`}</p>
                      <p className='font-bold text-sm'>{result.vote_count}</p>
                    </div>
                  ))}

                  {JSON.parse(election.results as string).length > 0 && !election.active && (
                    <p className='font-bold text-lg mt-4'>Winner: {getWinner(election.results as string)} </p>
                    
                  )}
                  
                </section>
                 
              )}
             
              </div>
          ))
          
        )}

        {elections && elections.length === 0 && (
          <p className='text-center text-sm text-red-500'>No election have been created!</p>
        )}
    

        
        
        </main>
    )
}