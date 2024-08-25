interface VoterSchema {
    first_name: string;
    last_name: string;
    middle_name: string;
    date_of_birth: string;
    email_address: string;
    occupation: string;
    phone_number: string;
    nin: string;
    lga_of_origin: string;
    state_of_origin: string;
    residential_address: string;
    state_of_residence: string;
    lga_of_residence: string;
    image_url: string;
    gender: string;
}
interface LGA { 
    id: string;
    name: string;
    location?: string
}
interface CardDetails {
    image: string,
    first_name: string;
    last_name: string;
    other_name: string;
    date_of_birth: string;
    _vin: string;
    home_addr: string;
    home_lga: string;
    occupation: string;
}
interface Party {
    id: number;
    name: string;
    acronym: string;
    logo: string;
    count?: number;
}
interface District {
    id: string;
    name: string;
}
interface Candidate {
    id: number
    name: string;
    election_type: string;
    sen_type: string | null;
    party: string;
}
interface Voter {
    first_name: string;
    last_name: string;
    other_name: string;
    _vin: string;
    count?: number;
    gender: string;
}
interface Election {
    id: number;
    name: string;
    type: "sen" | "gov";
    status: "Not Started" | "In Progress" | "Ended";
    description?: string;
    candidates?: FormCandidates[];
    active: boolean;
    count?: number;
    start_date?: string;
    end_date?: string;
    created_at?: string;
    results?: string | Result[];
    voters?: number [] | null
}
interface Result {
    name: string;
    party: string;
    vote_count: number;
    voters: number [];
    sen_type: string | null;
    active?: boolean;
}
interface FormCandidates {
	id: number;
	name: string;
    party: string;
    sen_type: string | null;
}
interface User {
  id: number;
  first_name: string;
  home_lga: string;
  email: string;
}