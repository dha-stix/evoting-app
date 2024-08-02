import { useState } from "react"

export default function VotersContent({ voters, setVoters }: { voters: Voter[], setVoters: any }) {
    const [vin, setVin] = useState<string>("")
    const [searching, setSearching] = useState<boolean>(false)


    const searchVoter = async () => { 
        try {
            const res = await fetch(`/api/voters/search?vin=${vin}`)
            const data = await res.json()
            setVoters(data.voter)
            setSearching(false)
        } catch (error) { 
            alert("Voter not found")
            setSearching(false)
        }
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSearching(true)
        searchVoter()
    }

    
    return (
        <div>
            <h2 className="font-bold text-lg text-green-600">Search for a Voter</h2>

            <form className="mb-10 flex w-full items-center space-x-4" onSubmit={handleSubmit}>
                <input type="text" className="w-2/3 border border-gray-300 py-2 px-4 text-sm rounded" placeholder="Enter VIN" value={vin} 
                onChange={e => setVin(e.target.value)}/>
                <button className="w-1/3 bg-green-500 text-white py-2 px-4 rounded" disabled={searching}>{searching ? "Searching...": "Search"}</button>
            </form>

             <h2 className="font-bold text-xl text-red-600">Registered Voters</h2>
            <p className="text-sm mb-4">Full list of Registered voters</p>

            <div className="w-full">
                    <table className="w-full border-collapse table-auto">
                        <thead>
                            <tr>
                            <th>VIN</th>
                            <th>Name</th>
                            <th>Gender</th>
                            </tr>
                        </thead>
                    <tbody>
                        {voters.map((voter) => (
                            <tr key={voter._vin} className="border-b border-gray-200">
                                <td className="py-2 px-4">{voter._vin}</td>
                                <td className="py-2 px-4"> {voter.last_name.toUpperCase()}, {voter.first_name} {voter.other_name}</td>
                                <td className="py-2 px-4">{voter.gender}</td>
                            </tr>
                            
                        ))}
                     
             
                        </tbody>
                    </table>
            </div>
        </div>
        
    )
}