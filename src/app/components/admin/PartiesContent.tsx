import { MdDelete } from "react-icons/md";
import { useState, useCallback, useEffect } from "react";


export default function PartiesContent({ parties }: { parties: Party[] }) {
    const [partyName, setPartyName] = useState<string>('');
    const [partyAcronym, setPartyAcronym] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [logo, setLogo] = useState<string>("");

    const generateAcronym = (sentence: string): string => {
    return sentence
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    };

    const handlePartyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        setPartyName(e.target.value)
        setPartyAcronym(generateAcronym(e.target.value))
    }
    
    const handleAcronymChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        setPartyAcronym(e.target.value)
    }

    const handleFileReader = (e: React.ChangeEvent<HTMLInputElement>) => {
		const reader = new FileReader();
		if (e.target.files && e.target.files[0]) {
			reader.readAsDataURL(e.target.files[0]);
		}
		reader.onload = (readerEvent) => {
			if (readerEvent.target && readerEvent.target.result) {
				setLogo(readerEvent.target.result as string);
			}
		};
    };
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { 
        e.preventDefault();
        setSubmitting(true);
        handleAddPoliticalParty();
    }

    const handleAddPoliticalParty = async () => {
        try {
            const response = await fetch('/api/party', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ partyName, logo, partyAcronym }),
            });
            const data = await response.json();
            alert(data.message);
            setSubmitting(false);
            setPartyAcronym('');
            setPartyName(''); 
        } catch (error) {
            console.error(error)
            setSubmitting(false);
        }
    }
    
  

    const handleDeleteParty = async (acronym: string) => {
        try {
            const request = await fetch(`/api/party?acronym=${acronym}`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json',
                },   
            })

            const response = await request.json()
            console.log(response)
            alert(response.message)

        } catch (err) {
            console.error(err)
        }

    }


	return (
		<div>
			<h2 className='font-bold text-xl text-green-600'>
				Add a Political Party
			</h2>
			<p className='text-sm mb-4'>Create Political Parties</p>

			<form className='w-full mb-10' onSubmit={handleSubmit}>
				<section className='flex items-center mb-3 space-x-3'>
					<div className='w-1/3'>
						<label htmlFor='name' className='text-sm'>
							Party Name
						</label>
						<input
							type='text'
                            id='name'
                            value={partyName}
                            onChange={handlePartyNameChange}
                            required
							className='w-full border-[1px] px-4 py-2 rounded text-sm border-gray-200'
						/>
                    </div>
                    <div className='w-1/3'>
						<label htmlFor='name' className='text-sm'>
							Party Acronym
						</label>
						<input
							type='text'
                            id='name'
                            value={partyAcronym}
                            onChange={handleAcronymChange}
                            required
							className='w-full border-[1px] px-4 py-2 rounded text-sm border-gray-200'
						/>
					</div>
					<div className='w-1/3'>
						<label htmlFor='logo' className='text-sm'>
							Party Logo
						</label>
						<input
							type='file'
                            id='logo'
                            name="logo"
                            required
                            onChange={handleFileReader}
                            className='w-full border-[1px] px-4 py-2 rounded text-sm border-gray-200'
                            accept="image/jpeg, image/png"
						/>
					</div>

				</section>
				<button className='bg-green-600 text-white px-4 py-2 rounded' disabled={submitting}>
					{submitting ? 'Submitting...' : 'Add Party'}
				</button>
			</form>

			<h2 className='font-bold text-xl text-red-600'>
				Recognized Political Parties
			</h2>

			<div className='w-full mb-10'>
				<table className='w-full border-collapse table-auto'>
					<thead>
						<tr>
							<th>Names</th>
                            <th>Actions</th>
						</tr>
					</thead>
                    <tbody>
                        {parties.map((party) => (
                            <tr key={party.id}>
                                <td className='md:text-sm text-xs'>{party.name} ({party.acronym})</td>
                                <td><MdDelete className="text-red-500 text-lg cursor-pointer" onClick={() => handleDeleteParty(party.acronym)}/></td>
                            </tr>
                        ))}
						
						
					</tbody>
				</table>
			</div>
		</div>
	);
}