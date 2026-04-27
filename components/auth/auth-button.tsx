import { getProfile } from '@/lib/auth/actions'
import SignInModal from './sign-in-modal'
import UserMenu from './user-menu'

export default async function AuthButton() {
  const profile = await getProfile()

  if (!profile) {
    return <SignInModal />
  }

  return <UserMenu profile={profile} />
}
