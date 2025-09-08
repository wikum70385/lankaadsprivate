export interface Ad {
  id: string
  title: string
  description: string
  price: number
  category: string
  contact_number: string
  is_whatsapp: boolean
  is_viber: boolean
  district: string
  city: string
  user_id: string
  created_at: string
  edit_locked_until: string
  expires_at: string
  status: string
  images: string[] | null
  username?: string
  telephone?: string
} 