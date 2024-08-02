export default function ElectionContent() {
    return (
        <div>
            <h2 className="font-bold text-xl text-green-600">Start an Election</h2>
            <p className="text-sm mb-4">Create your Senatorial and Governorship elections with AuthVote</p>

                      <div className="w-full">
                    <table className="w-full border-collapse table-auto">
                        <thead>
                            <tr>
                            <th>Type</th>
                            <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td className="text-sm">Senatorial District Election</td>
                            <td className="text-sm">Not Started</td>
                            <td className="text-sm">
                                <button className="bg-green-500 text-white px-2 py-1 rounded-md">Start</button>
                            </td>
                        </tr>
                        <tr>
                            <td className="text-sm">Governorship Election</td>
                            <td className="text-sm">In Progress</td>
                             <td className="text-sm"><button className="bg-red-500 text-white px-2 py-1 rounded-md">Stop</button></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
        </div>
        
    )
}