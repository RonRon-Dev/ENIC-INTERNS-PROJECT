import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function SignupPage({ ...props }: React.ComponentProps<typeof Card>) {
    return (

        <div className="min-h-screen flex items-center justify-center">
            <Card {...props} className="w-full max-w-lg ">
                <CardHeader>
                    <CardTitle>Request an Account</CardTitle>
                    <CardDescription>
                        Fill out the form below to request account access
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <Input id="name" type="text" placeholder="eg. Juan Dela Cruz" required />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="eg. enic@example.com"
                                    required
                                />
                                <FieldDescription>
                                    We&apos;ll use this to contact you. We will not share your email
                                    with anyone else.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <Input id="password" type="password" required />
                                <FieldDescription>
                                    Must be at least 8 characters long.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirm-password">
                                    Confirm Password
                                </FieldLabel>
                                <Input id="confirm-password" type="password" required />
                                <FieldDescription>Please confirm your password.</FieldDescription>
                            </Field>
                            <FieldGroup>
                                <Field>
                                    <Button type="submit">Submit</Button>
                                    {/* <Button variant="outline" type="button">
                                        Sign up with Google
                                    </Button> */}
                                    <FieldDescription className="px-6 text-center">
                                        Already have an account? <a href="/">Sign in</a>
                                    </FieldDescription>
                                </Field>
                            </FieldGroup>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
