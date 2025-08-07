'use client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useModal } from '@/providers/modal-provider'
import CustomModal from '@/components/global/custom-modal'
import WorkflowForm from '@/components/forms/workflow-form'
import { useBilling } from '@/providers/billing-provider'

type Props = {}

const WorkflowButton = (props: Props) => {
    const {setOpen, setClose} = useModal()
    const { credits } = useBilling()
    const handleClick = () => {
        setOpen(
            <CustomModal
            title="Create New Workflow"
            subheading="Create a new workflow to automate your tasks"   
            >
                <WorkflowForm />
            </CustomModal>
        )
    }
  return (
    <Button size="icon"  {...(credits !== '0' ?{onClick: handleClick} : {disabled: true})}>

        <Plus className='w-4 h-4' />
    </Button>
  )
}

export default WorkflowButton