import { createContext, useState } from "react";

export const VoterContext = createContext<any>(null);

export const VoterProvider = ({ children }: { children: React.ReactNode }) => {
    const [voterData, setVoterData] = useState<VoterSchema>({
        first_name: "",
        last_name: "",
        middle_name: "",
        date_of_birth: "",
        email_address: "",
        occupation: "",
        gender: "",
        phone_number: "",
        nin: "",
        lga_of_origin: "",
        state_of_origin: "",
        residential_address: "",
        state_of_residence: "",
        lga_of_residence: "",
        image_url: "",
    })

    const updateVoterData = (newData: any) => {
        setVoterData(prevData => ({
            ...prevData,
            ...newData
        }));
    };

    return (
        <VoterContext.Provider value={{ voterData, updateVoterData }}>
            {children}
        </VoterContext.Provider>
)
}


